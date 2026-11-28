import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { BusinessUser } from '../businesses/entities/business-user.entity';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessUser, User])],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
