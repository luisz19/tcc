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
import { Project } from 'src/project/entities/project.entity';
import { validateMoney } from 'src/common/validators/money.validator';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
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

  async deletePackage(
    id: string,
    userId: string,
    confirmed = false,
  ): Promise<void> {
    const packageProject = await this.packageRepository.findOneBy({
      id,
      userId,
    });

    if (!packageProject) {
      throw new NotFoundException();
    }

    const projectCount = await this.projectRepository.count({
      where: { packageId: packageProject.id, userId },
    });

    if (projectCount > 0 && !confirmed) {
      throw new ConflictException({
        code: 'PACKAGE_IN_USE',
        message: 'Package is associated with existing projects.',
        projectCount,
      });
    }

    await this.packageRepository.manager.transaction(async (manager) => {
      if (projectCount > 0) {
        await manager.update(
          Project,
          { packageId: packageProject.id, userId },
          { packageId: null },
        );
      }

      await manager.delete(Package, {
        id: packageProject.id,
        userId,
      });
    });
  }

  private validateBasePrice(price: number): void {
    validateMoney(price, {
      fieldName: 'base_price',
    });
  }
}
