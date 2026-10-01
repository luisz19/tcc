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

  async findAll(
    userId: string,
    filters: { name?: string; phone?: string } = {},
  ): Promise<Client[]> {
    const query = this.clientsRepository.createQueryBuilder('clients');
    query.where('clients.userId = :userId', { userId });
    if (filters.name) {
      query.andWhere('LOWER(clients.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }
    if (filters.phone) {
      query.andWhere('clients.phone LIKE :phone', {
        phone: `%${filters.phone}%`,
      });
    }
    return query.getMany();
  }

  async findOneOrFail(id: string, userId: string): Promise<Client> {
    const clients = await this.clientsRepository.findOneBy({ id, userId });

    if (!clients) {
      throw new NotFoundException();
    }

    return clients;
  }

  async findOne(id: string, userId: string): Promise<Client> {
    const clients = await this.findOneOrFail(id, userId);
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

    const { userId, ...clientData } = createClientDto;
    const clients = this.clientsRepository.create({
      ...clientData,
      userId,
    });
    return await this.clientsRepository.save(clients);
  }

  async updateClient(
    id: string,
    userId: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const clients = await this.findOneOrFail(id, userId);

    Object.assign(clients, updateClientDto);
    return this.clientsRepository.save(clients);
  }

  async deleteClient(id: string, userId: string): Promise<void> {
    const clients = await this.findOneOrFail(id, userId);

    await this.clientsRepository.delete(clients.id);
  }
}
