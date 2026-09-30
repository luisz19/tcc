import {
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

    const packageProject = this.packageRepository.create(createPackageDto);
    return await this.packageRepository.save(packageProject);
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    const packageProject = await this.findOneOrFail(id);

    Object.assign(packageProject, updatePackageDto);
    return this.packageRepository.save(packageProject);
  }

  async deletePackage(id: string): Promise<void> {
    const packageProject = await this.findOneOrFail(id);

    await this.packageRepository.delete(packageProject.id);
  }
}
