import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { UpdateProjectDto } from './dto/update-project';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    const query = this.projectRepository.createQueryBuilder('project');
    query.where('project.userId = :userId', { userId });
    return query.getMany();
  }

  async findOneOrFail(id: string): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });

    if (!project) {
      throw new NotFoundException();
    }

    return project;
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.findOneOrFail(id);
    return project;
  }

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const existingProject = await this.projectRepository.findOne({
      where: {
        title: createProjectDto.name,
        userId: createProjectDto.userId,
      },
    });

    if (existingProject) {
      throw new ConflictException(
        'Project with the same title already exists for this user.',
      );
    }

    const project = this.projectRepository.create(createProjectDto);
    return await this.projectRepository.save(project);
  }

  async updateProject(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOneOrFail(id);

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async deleteProject(id: string): Promise<void> {
    const project = await this.findOneOrFail(id);

    await this.projectRepository.delete(project.id);
  }
}
