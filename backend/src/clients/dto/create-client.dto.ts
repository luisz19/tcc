import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PersonType } from '../model/clients.model';

export class CreateClientDto {
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString({
    each: true,
  })
  @IsEnum(PersonType)
  personType?: PersonType;
}
