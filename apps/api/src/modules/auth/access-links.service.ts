import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';
import { BusinessUser } from '../businesses/entities/business-user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { PushSubscription } from '../notifications/entities/push-subscription.entity';
import { ACCESS_LINK_TTL_MS } from './access.constants';
import { AccessLink } from './entities/access-link.entity';
import { User } from './entities/user.entity';

const INVALID =
  'Este enlace ya no sirve. Pide uno nuevo a tu administrador.';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AccessLinksService {
  constructor(
    @InjectRepository(AccessLink)
    private readonly links: Repository<AccessLink>,
    private readonly businesses: BusinessesService,
  ) {}

  /** Un enlace nuevo; los anteriores de esa persona dejan de servir. */
  async create(
    userId: string,
    createdBy: string,
    manager: EntityManager = this.links.manager,
  ) {
    await manager.delete(AccessLink, { userId });
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ACCESS_LINK_TTL_MS);
    await manager.insert(AccessLink, {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy,
    });
    return { token, expiresAt };
  }

  /** A quién le pertenece un enlace vigente, para saludarle antes de pedir contraseña. */
  async inspect(token: string) {
    const { user } = await this.findValid(this.links.manager, token);
    return { name: user.name, email: user.email };
  }

  /** Guarda la contraseña y gasta el enlace. */
  async redeem(token: string, password: string): Promise<User> {
    // Antes de gastar tiempo cifrando, que el enlace exista
    await this.findValid(this.links.manager, token);
    const passwordHash = await bcrypt.hash(password, 12);

    return this.links.manager.transaction(async (manager) => {
      const { link, user } = await this.findValid(manager, token, true);
      await manager.update(
        User,
        { id: user.id },
        { passwordHash, passwordChangedAt: new Date() },
      );
      await manager.update(AccessLink, { id: link.id }, { usedAt: new Date() });
      // Por si el cambio es porque perdió el celular
      await manager.delete(PushSubscription, { userId: user.id });
      return user;
    });
  }

  private async findValid(
    manager: EntityManager,
    token: string,
    lock = false,
  ) {
    const link = await manager.findOne(AccessLink, {
      where: {
        tokenHash: hashToken(token),
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      // Dos usos a la vez: el segundo espera y ya lo encuentra gastado
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!link) throw new NotFoundException(INVALID);

    const business = await this.businesses.getCurrentBusiness();
    const [user, member] = await Promise.all([
      manager.findOne(User, { where: { id: link.userId, isActive: true } }),
      manager.existsBy(BusinessUser, {
        businessId: business.id,
        userId: link.userId,
      }),
    ]);
    if (!user || !member) throw new NotFoundException(INVALID);
    return { link, user };
  }
}
