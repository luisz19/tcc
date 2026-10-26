import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Package } from 'src/package/entities/package.entity';
import { Financial } from 'src/financial/entities/financial.entity';
// mport { ProjectRepository } from './repositories/project.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Package, Financial]),
    AuthModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
