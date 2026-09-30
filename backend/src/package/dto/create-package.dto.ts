import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePackageDto {
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  base_price: number;
}
