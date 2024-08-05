import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { UserRepository } from '../../modules/auth/repository/user.repository';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [SeederService, UserRepository, Logger, PrismaService],
  exports: [SeederService],
})
export class SeederModule {}