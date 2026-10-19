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
import { Project } from 'src/project/entities/project.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
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

  async findProjectsByClientId(
    clientId: string,
    userId: string,
  ): Promise<Partial<Project>[]> {
    return this.projectsRepository.find({
      where: {
        clientId,
        client: { userId },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
      },
    });
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

  async deleteClient(
    id: string,
    userId: string,
    confirmed = false,
  ): Promise<void> {
    const clients = await this.findOneOrFail(id, userId);
    const projectCount = await this.projectsRepository.count({
      where: { clientId: clients.id, userId },
    });

    if (projectCount > 0 && !confirmed) {
      throw new ConflictException({
        code: 'CLIENT_HAS_PROJECTS',
        message: 'Client has projects associated with it.',
        projectCount,
      });
    }

    await this.clientsRepository.manager.transaction(async (manager) => {
      await manager.delete(Project, { clientId: clients.id, userId });
      await manager.delete(Client, { id: clients.id, userId });
    });
  }
}
