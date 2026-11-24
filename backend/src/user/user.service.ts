import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../common/password/password.service';
import { Financial } from '../financial/entities/financial.entity';
import { Project } from '../project/entities/project.entity';
import { Package } from '../package/entities/package.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  private async findOneOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  public async findOne(id: string): Promise<User> {
    const user = await this.findOneOrFail(id);
    return user;
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  public async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findOneByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.passwordService.hash(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  public async deleteUser(id: string): Promise<void> {
    const user = await this.findOneOrFail(id);

    await this.userRepository.manager.transaction(async (manager) => {
      await manager.delete(Financial, { userId: user.id });
      await manager.delete(Project, { userId: user.id });
      await manager.delete(Package, { userId: user.id });
      await manager.delete(Client, { userId: user.id });
      await manager.delete(User, { id: user.id });
    });
  }
}
