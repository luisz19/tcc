import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Project } from 'src/project/entities/project.entity';
import { FinancialModule } from 'src/financial/financial.module';
import { Client } from 'src/clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Client]),
    AuthModule,
    FinancialModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
