import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { FinancialStatus, FinancialType } from '../model/financial.model';

export class CreateFinancialDto {
  userId: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(FinancialType)
  type: FinancialType;

  @IsOptional()
  @IsEnum(FinancialStatus)
  status?: FinancialStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsString()
  date: Date;
}
