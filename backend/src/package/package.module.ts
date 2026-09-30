import { Module } from '@nestjs/common';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { AuthModule } from 'src/auth/auth.module';
// mport { PackageRepository } from './repositories/package.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Package]), AuthModule],
  controllers: [PackageController],
  providers: [PackageService],
})
export class PackageModule {}
