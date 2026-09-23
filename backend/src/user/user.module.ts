import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordModule } from 'src/common/password/password.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import the User entity into the module
    PasswordModule,
  ],

  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
