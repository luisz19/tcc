import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { Repository } from 'typeorm';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreatePackageDto } from './dto/create-package.dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  async findAll(userId: string): Promise<Package[]> {
    const query = this.packageRepository.createQueryBuilder('packageProject');
    query.where('packageProject.userId = :userId', { userId });
    return query.getMany();
  }

  async findOneOrFail(id: string): Promise<Package> {
    const packageProject = await this.packageRepository.findOneBy({ id });

    if (!packageProject) {
      throw new NotFoundException();
    }

    return packageProject;
  }

  async findOne(id: string): Promise<Package> {
    const packageProject = await this.findOneOrFail(id);
    return packageProject;
  }

  async createPackage(createPackageDto: CreatePackageDto): Promise<Package> {
    const existingPackage = await this.packageRepository.findOne({
      where: {
        name: createPackageDto.name,
        userId: createPackageDto.userId,
      },
    });

    if (existingPackage) {
      throw new ConflictException(
        'Package with the same name already exists for this user.',
      );
    }

    this.validateBasePrice(createPackageDto.base_price);

    const formattedPrice =
      Math.round(Number(createPackageDto.base_price) * 100) / 100;

    const packageProject = this.packageRepository.create({
      ...createPackageDto,
      base_price: formattedPrice,
    });

    return await this.packageRepository.save(packageProject);
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    const packageProject = await this.findOneOrFail(id);

    if (updatePackageDto.base_price !== undefined) {
      this.validateBasePrice(updatePackageDto.base_price);
      updatePackageDto.base_price =
        Math.round(Number(updatePackageDto.base_price) * 100) / 100;
    }

    if (
      updatePackageDto.name &&
      updatePackageDto.name !== packageProject.name
    ) {
      const existingPackage = await this.packageRepository.findOne({
        where: {
          name: updatePackageDto.name,
          userId: packageProject.userId,
        },
      });

      if (existingPackage) {
        throw new ConflictException(
          'Package with the same name already exists for this user.',
        );
      }
    }

    Object.assign(packageProject, updatePackageDto);

    return await this.packageRepository.save(packageProject);
  }

  async deletePackage(id: string): Promise<void> {
    const packageProject = await this.findOneOrFail(id);

    await this.packageRepository.delete(packageProject.id);
  }

  private validateBasePrice(price: number): void {
    const basePrice = Number(price);

    if (isNaN(basePrice) || basePrice <= 0) {
      throw new BadRequestException(
        'base_price must be a positive number greater than 0.',
      );
    }

    const decimalPlaces = (basePrice.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new BadRequestException(
        'base_price must have up to 2 decimal places.',
      );
    }
  }
}
