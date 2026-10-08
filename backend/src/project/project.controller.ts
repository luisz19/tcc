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
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { findOneParams } from 'src/find-one.params';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project';
import { CurrentUserId } from 'src/user/decorators/current-user-id.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  public async findAll(@CurrentUserId() userId: string): Promise<Project[]> {
    return this.projectService.findAll(userId);
  }

  @Get('/:id')
  public async findOne(
    @Param() params: findOneParams,
    @CurrentUserId() userId: string,
  ): Promise<Project> {
    return this.projectService.findOneOrFail(params.id, userId);
  }

  @Post()
  public async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUserId() userId: string,
  ): Promise<Project> {
    return this.projectService.createProject({
      ...createProjectDto,
      userId,
    });
  }

  @Patch('/:id')
  public async updateProject(
    @Param() params: findOneParams,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUserId() userId: string,
  ): Promise<Project> {
    return this.projectService.updateProject(params.id, userId, updateProjectDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteProject(
    @Param() params: findOneParams,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    return this.projectService.deleteProject(params.id, userId);
  }
}
