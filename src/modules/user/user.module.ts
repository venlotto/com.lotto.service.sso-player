import { Logger, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserRepositoryPrisma } from './repository/user.repository.prisma';
import { UserRepository } from './repository/user.repository.interface';
import { CommonModule } from 'src/common/common.module';
import { NewUserHandler } from './handler/new-user.handler';
import { NewUserController } from './controller/new-user.controller';

@Module({
  controllers: [NewUserController],
  imports: [
    AuthModule,
    CommonModule,

  ],
  providers: [
    NewUserHandler,
    Logger,
    {
      provide: UserRepository,
      useClass: UserRepositoryPrisma,
    },
  ],
})
export class UserModule {}
