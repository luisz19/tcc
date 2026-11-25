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
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';
import { findOneParams } from 'src/find-one.params';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Project } from 'src/project/entities/project.entity';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  public async findAll(
    @CurrentUser() userId: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
  ): Promise<Client[]> {
    return await this.clientService.findAll(userId, { name, phone });
  }

  @Get('/:id')
  public async findOne(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
  ): Promise<Client> {
    return this.clientService.findOneOrFail(params.id, userId);
  }

  @Get('/:id/projects')
  public async findProjectsByClientId(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
  ): Promise<Partial<Project>[]> {
    return this.clientService.findProjectsByClientId(params.id, userId);
  }

  @Post()
  public async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() userId: string,
  ): Promise<Client> {
    return this.clientService.createClient({
      ...createClientDto,
      userId,
    });
  }

  @Patch('/:id')
  public async updateClient(
    @Param() params: findOneParams,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() userId: string,
  ): Promise<Client> {
    return this.clientService.updateClient(params.id, userId, updateClientDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteClient(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
    @Query('confirm') confirm?: string,
  ): Promise<void> {
    await this.clientService.deleteClient(
      params.id,
      userId,
      confirm === 'true',
    );
  }
}
