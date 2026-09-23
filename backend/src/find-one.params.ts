import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class findOneParams {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;
}
