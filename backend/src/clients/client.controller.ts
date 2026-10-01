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
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';
import { findOneParams } from 'src/find-one.params';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client';
import { CurrentUserId } from 'src/user/decorators/current-user-id.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('client')
@UseGuards(AuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  public async findAll(@CurrentUserId() userId: string): Promise<Client[]> {
    return await this.clientService.findAll(userId);
  }

  @Get('/:id')
  public async findOne(@Param() params: findOneParams): Promise<Client> {
    return this.clientService.findOneOrFail(params.id);
  }

  @Post()
  public async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentUserId() userId: string,
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
  ): Promise<Client> {
    return this.clientService.updateClient(params.id, updateClientDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteClient(@Param() params: findOneParams): Promise<void> {
    return this.clientService.deleteClient(params.id);
  }
}
