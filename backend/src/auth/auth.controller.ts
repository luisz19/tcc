import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Request,
  Post,
  SerializeOptions,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './login.response';
import type { AuthRequest } from './auth.request';
import { UserService } from '../user/user.service';
import { AuthGuard } from './guards/auth.guard';

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
  async profile(@Request() request: AuthRequest): Promise<User> {
    // This endpoint requires authentication, so the user information will be available in the request object
    const user = await this.userService.findOne(request.user.sub);

    return user;
  }
}
