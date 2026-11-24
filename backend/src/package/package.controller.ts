import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PackageService } from './package.service';
import { Package } from './entities/package.entity';
import { findOneParams } from 'src/find-one.params';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('packages')
@UseGuards(AuthGuard)
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  public async findAll(@CurrentUser() userId: string): Promise<Package[]> {
    return this.packageService.findAll(userId);
  }

  @Get('/:id')
  public async findOne(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
  ): Promise<Package> {
    return this.packageService.findOneOrFail(params.id, userId);
  }

  @Post()
  public async createPackage(
    @Body() createPackageDto: CreatePackageDto,
    @CurrentUser() userId: string,
  ): Promise<Package> {
    return this.packageService.createPackage({
      ...createPackageDto,
      userId,
    });
  }

  @Patch('/:id')
  public async updatePackage(
    @Param() params: findOneParams,
    @Body() updatePackageDto: UpdatePackageDto,
    @CurrentUser() userId: string,
  ): Promise<Package> {
    return this.packageService.updatePackage(
      params.id,
      userId,
      updatePackageDto,
    );
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deletePackage(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
    @Query('confirm') confirm?: string,
  ): Promise<void> {
    return this.packageService.deletePackage(
      params.id,
      userId,
      confirm === 'true',
    );
  }
}
