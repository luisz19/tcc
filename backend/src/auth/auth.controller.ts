import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  SerializeOptions,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './login.response';
import { UserService } from '../user/user.service';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({
  strategy: 'excludeAll',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.authService.register(createUserDto);
    return user;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const accessToken = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return new LoginResponse({ accessToken });
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async profile(@CurrentUser() userId: string): Promise<User> {
    const user = await this.userService.findOne(userId);

    return user;
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@CurrentUser() userId: string): Promise<void> {
    return this.userService.deleteUser(userId);
  }
}
