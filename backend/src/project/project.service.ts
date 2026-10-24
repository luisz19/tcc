import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { UpdateProjectDto } from './dto/update-project';
import { CreateProjectDto } from './dto/create-project.dto';
import { Package } from 'src/package/entities/package.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    const query = this.projectRepository.createQueryBuilder('project');
    query.where('project.userId = :userId', { userId });
    return query.getMany();
  }

  async findOneOrFail(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id, userId });

    if (!project) {
      throw new NotFoundException();
    }

    return project;
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.findOneOrFail(id, userId);
    return project;
  }

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    this.validateProjectInterval(
      createProjectDto.startAt,
      createProjectDto.endAt,
    );

    const existingProject = await this.projectRepository.findOne({
      where: {
        title: createProjectDto.title,
        userId: createProjectDto.userId,
      },
    });

    let agreedPrice = createProjectDto.agreed_price;

    if (createProjectDto.packageId) {
      const packageProject = await this.packageRepository.findOne({
        where: {
          id: createProjectDto.packageId,
          userId: createProjectDto.userId,
        },
      });

      if (!packageProject) {
        throw new NotFoundException('Package not found.');
      }

      if (agreedPrice === undefined) {
        agreedPrice = Number(packageProject.base_price);
      }
    }

    const existingProjectInSameDateAndTime =
      createProjectDto.startAt && createProjectDto.endAt
        ? await this.findScheduleConflict(
            createProjectDto.userId,
            createProjectDto.startAt,
            createProjectDto.endAt,
          )
        : null;

    if (existingProjectInSameDateAndTime) {
      throw new ConflictException({
        code: 'PROJECT_SCHEDULE_CONFLICT',
        message: 'Project schedule overlaps an existing project.',
        conflict: {
          id: existingProjectInSameDateAndTime.id,
          title: existingProjectInSameDateAndTime.title,
          startAt: existingProjectInSameDateAndTime.startAt,
          endAt: existingProjectInSameDateAndTime.endAt,
        },
      });
    }

    if (existingProject) {
      throw new ConflictException(
        'Project with the same title already exists for this user.',
      );
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      agreed_price: agreedPrice,
    });

    return this.projectRepository.save(project);
  }

  async updateProject(
    id: string,
    userId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOneOrFail(id, userId);

    const startAt = updateProjectDto.startAt ?? project.startAt?.toISOString();
    const endAt = updateProjectDto.endAt ?? project.endAt?.toISOString();
    this.validateProjectInterval(startAt, endAt);

    const conflict =
      startAt && endAt
        ? await this.findScheduleConflict(userId, startAt, endAt, id)
        : null;

    if (conflict) {
      throw new ConflictException({
        code: 'PROJECT_SCHEDULE_CONFLICT',
        message: 'Project schedule overlaps an existing project.',
        conflict: {
          id: conflict.id,
          title: conflict.title,
          startAt: conflict.startAt,
          endAt: conflict.endAt,
        },
      });
    }

    if (updateProjectDto.packageId) {
      const packageProject = await this.packageRepository.findOne({
        where: {
          id: updateProjectDto.packageId,
          userId,
        },
      });

      if (!packageProject) {
        throw new NotFoundException('Package not found.');
      }

      if (updateProjectDto.agreed_price === undefined) {
        updateProjectDto.agreed_price = Number(packageProject.base_price);
      }
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  private validateProjectInterval(startAt?: string, endAt?: string): void {
    if (!startAt && !endAt) {
      return;
    }

    if (!startAt || !endAt) {
      throw new BadRequestException(
        'startAt and endAt must be provided together.',
      );
    }

    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      throw new BadRequestException('startAt must be earlier than endAt.');
    }
  }

  private findScheduleConflict(
    userId: string,
    startAt: string,
    endAt: string,
    excludedProjectId?: string,
  ): Promise<Project | null> {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .where('project.userId = :userId', { userId })
      .andWhere('project.startAt < :endAt', { endAt })
      .andWhere('project.endAt > :startAt', { startAt });

    if (excludedProjectId) {
      query.andWhere('project.id != :excludedProjectId', {
        excludedProjectId,
      });
    }

    return query.getOne();
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.findOneOrFail(id, userId);

    await this.projectRepository.delete(project.id);
  }
}
