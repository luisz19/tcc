import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../common/password/password.service';

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

    Object.assign(user, updateUserDto);
    console.log('Updated user:', user);
    return await this.userRepository.save(user);
  }

  public async deleteUser(id: string): Promise<void> {
    const user = await this.findOneOrFail(id);

    await this.userRepository.delete(user.id);
  }
}
