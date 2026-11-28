import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { isSessionStale } from './session.rules';

/**
 * El token solo dice quién es; aquí se comprueba contra la base que la cuenta siga
 * activa y que la sesión no sea anterior a un cambio de contraseña.
 */
@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async assertCurrent(session: AuthenticatedUser): Promise<User> {
    const user = await this.users.findOne({
      where: { id: session.id, isActive: true },
    });
    if (!user || isSessionStale(session.issuedAt, user.passwordChangedAt)) {
      throw new UnauthorizedException('Tu sesión terminó. Vuelve a entrar.');
    }
    return user;
  }
}
