import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  icon: string;
}
