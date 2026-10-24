import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { FinancialStatus, FinancialType } from '../model/financial.model';

export class CreateFinancialDto {
  userId: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString({
    each: true,
  })
  @IsEnum(FinancialType)
  type: FinancialType;

  @IsString({
    each: true,
  })
  @IsEnum(FinancialStatus)
  @IsNotEmpty()
  status: FinancialStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value: number;

  @IsNotEmpty()
  @IsString()
  date: Date;
}
