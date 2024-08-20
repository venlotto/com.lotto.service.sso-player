import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { UserRepositoryPrisma } from '../user/repository/user.repository.prisma';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [SeederService, UserRepositoryPrisma, Logger, PrismaService],
  exports: [SeederService],
})
export class SeederModule {}
