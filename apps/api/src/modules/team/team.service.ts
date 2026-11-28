import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { AccessLinksService } from '../auth/access-links.service';
import { AccessLink } from '../auth/entities/access-link.entity';
import { User } from '../auth/entities/user.entity';
import { BusinessUser } from '../businesses/entities/business-user.entity';
import { BusinessRole } from '../businesses/enums/business-role.enum';
import { PushSubscription } from '../notifications/entities/push-subscription.entity';
import { CreateMemberDto, UpdateMemberDto } from './dto/team.dto';

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: BusinessRole;
  /** `invited`: todavía no ha creado su contraseña. */
  status: 'active' | 'invited';
  /** Quien tiene la cuenta principal: nadie más puede cambiarla ni quitarla. */
  isOwner: boolean;
  isYou: boolean;
}

const ALREADY = 'Ese correo ya está en tu equipo.';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(BusinessUser)
    private readonly members: Repository<BusinessUser>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly links: AccessLinksService,
  ) {}

  async list(businessId: string, actorId: string): Promise<TeamMember[]> {
    const [memberships, ownerId] = await Promise.all([
      this.members.find({
        where: { businessId },
        order: { createdAt: 'ASC', id: 'ASC' },
      }),
      this.ownerId(businessId),
    ]);
    if (memberships.length === 0) return [];

    const users = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where({ id: In(memberships.map((m) => m.userId)), isActive: true })
      .getMany();
    const byId = new Map(users.map((user) => [user.id, user]));

    return memberships.flatMap((membership) => {
      const user = byId.get(membership.userId);
      return user
        ? [this.toMember(user, membership.role, ownerId, actorId)]
        : [];
    });
  }

  async add(businessId: string, actorId: string, dto: CreateMemberDto) {
    const email = dto.email.toLowerCase();
    try {
      return await this.members.manager.transaction(async (manager) => {
        const existing = await manager.findOne(User, { where: { email } });
        if (
          existing &&
          (await manager.existsBy(BusinessUser, {
            businessId,
            userId: existing.id,
          }))
        ) {
          throw new ConflictException(ALREADY);
        }

        // Alguien que estuvo antes regresa con la contraseña por crear
        const user = existing
          ? await manager.save(User, {
              ...existing,
              name: dto.name,
              isActive: true,
              passwordHash: null,
              passwordChangedAt: new Date(),
            })
          : await manager.save(
              User,
              manager.create(User, {
                email,
                name: dto.name,
                passwordHash: null,
              }),
            );

        await manager.insert(BusinessUser, {
          businessId,
          userId: user.id,
          role: dto.role,
        });
        const link = await this.links.create(user.id, actorId, manager);

        const member: TeamMember = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: dto.role,
          status: 'invited',
          isOwner: false,
          isYou: false,
        };
        return { member, link };
      });
    } catch (error) {
      // Dos altas del mismo correo a la vez
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(ALREADY);
      }
      throw error;
    }
  }

  async update(
    businessId: string,
    actorId: string,
    userId: string,
    dto: UpdateMemberDto,
  ): Promise<TeamMember> {
    const membership = await this.membershipOrFail(businessId, userId);
    const ownerId = await this.ownerId(businessId);
    this.assertNotSomeoneElsesAccount(ownerId, actorId, userId);

    if (dto.role !== undefined && dto.role !== membership.role) {
      if (userId === actorId) {
        throw new BadRequestException(
          'No puedes cambiar tu propio tipo de acceso.',
        );
      }
      membership.role = dto.role;
      await this.members.save(membership);
    }
    if (dto.name !== undefined) {
      await this.users.update({ id: userId }, { name: dto.name });
    }

    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where({ id: userId })
      .getOneOrFail();
    return this.toMember(user, membership.role, ownerId, actorId);
  }

  async newAccessLink(businessId: string, actorId: string, userId: string) {
    await this.membershipOrFail(businessId, userId);
    this.assertNotSomeoneElsesAccount(
      await this.ownerId(businessId),
      actorId,
      userId,
    );
    return this.links.create(userId, actorId);
  }

  /** Quita el acceso al momento. Lo que esa persona anotó se conserva. */
  async remove(businessId: string, actorId: string, userId: string) {
    if (userId === actorId) {
      throw new BadRequestException('No puedes quitarte a ti.');
    }
    await this.membershipOrFail(businessId, userId);
    this.assertNotSomeoneElsesAccount(
      await this.ownerId(businessId),
      actorId,
      userId,
    );

    await this.members.manager.transaction(async (manager) => {
      await manager.delete(BusinessUser, { businessId, userId });
      await manager.delete(AccessLink, { userId });
      await manager.delete(PushSubscription, { userId });
      await manager.update(
        User,
        { id: userId },
        { passwordHash: null, passwordChangedAt: new Date() },
      );
    });
  }

  /** La cuenta principal es la del primer administrador. */
  private async ownerId(businessId: string): Promise<string | null> {
    const first = await this.members.findOne({
      where: { businessId, role: BusinessRole.ADMIN },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return first?.userId ?? null;
  }

  private assertNotSomeoneElsesAccount(
    ownerId: string | null,
    actorId: string,
    userId: string,
  ) {
    if (userId === ownerId && actorId !== ownerId) {
      throw new BadRequestException(
        'La cuenta principal solo la puede cambiar su dueño.',
      );
    }
  }

  private async membershipOrFail(businessId: string, userId: string) {
    const membership = await this.members.findOne({
      where: { businessId, userId },
    });
    if (!membership) {
      throw new NotFoundException('Esa persona ya no está en tu equipo.');
    }
    return membership;
  }

  private toMember(
    user: User,
    role: BusinessRole,
    ownerId: string | null,
    actorId: string,
  ): TeamMember {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      status: user.passwordHash ? 'active' : 'invited',
      isOwner: user.id === ownerId,
      isYou: user.id === actorId,
    };
  }
}
