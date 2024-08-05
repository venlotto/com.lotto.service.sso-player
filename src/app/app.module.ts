import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from '../common/services/prisma.service';
import { TerminusModule } from '@nestjs/terminus';
import { CoreModule } from 'src/core/core.module';
import { CommonModule } from 'src/common/common.module';
import {AuthModule} from "../modules/auth/auth.module";
import { SeederModule } from '../modules/seeder/seeder.module';

@Module({
  imports: [
    CommonModule,
    CoreModule,
    TerminusModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
  ],
})
export class AppModule {}