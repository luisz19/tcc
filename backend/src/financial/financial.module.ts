import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Financial } from './entities/financial.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Project } from 'src/project/entities/project.entity';
// mport { FinancialRepository } from './repositories/financial.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Financial, Project]), AuthModule],
  controllers: [FinancialController],
  providers: [FinancialService],
})
export class FinancialModule {}
