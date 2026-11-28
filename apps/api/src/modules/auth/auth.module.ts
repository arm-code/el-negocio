import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { AccessLinksService } from './access-links.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessLink } from './entities/access-link.entity';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { SessionService } from './session.service';

/**
 * Módulo global: expone `JwtAuthGuard` y `TenantGuard` para que cualquier
 * módulo de feature los use sin importarlos. `BusinessesModule` se importa
 * aquí para que `TenantGuard` pueda inyectar `BusinessesService`.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, AccessLink]), BusinessesModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    AccessLinksService,
    JwtAuthGuard,
    TenantGuard,
  ],
  exports: [JwtAuthGuard, TenantGuard, SessionService, AccessLinksService],
})
export class AuthModule {}
