import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { UpdateClientDto } from './dto/update-client';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async findAll(userId: string): Promise<Client[]> {
    const query = this.clientsRepository.createQueryBuilder('clients');
    query.where('clients.userId = :userId', { userId });
    return query.getMany();
  }

  async findOneOrFail(id: string): Promise<Client> {
    const clients = await this.clientsRepository.findOneBy({ id });

    if (!clients) {
      throw new NotFoundException();
    }

    return clients;
  }

  async findOne(id: string): Promise<Client> {
    const clients = await this.findOneOrFail(id);
    return clients;
  }

  async createClient(createClientDto: CreateClientDto): Promise<Client> {
    const existingClient = await this.clientsRepository.findOne({
      where: {
        name: createClientDto.name,
        userId: createClientDto.userId,
      },
    });

    if (existingClient) {
      throw new ConflictException(
        'Client with the same name already exists for this user.',
      );
    }

    const clients = this.clientsRepository.create(createClientDto);
    return await this.clientsRepository.save(clients);
  }

  async updateClient(
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const clients = await this.findOneOrFail(id);

    Object.assign(clients, updateClientDto);
    return this.clientsRepository.save(clients);
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.findOneOrFail(id);

    await this.clientsRepository.delete(clients.id);
  }
}
