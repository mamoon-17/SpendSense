import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateSavingsGoalDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  target_amount: number;

  @IsNumber()
  @IsOptional()
  current_amount?: number;

  @IsDateString()
  @IsNotEmpty()
  target_date: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsEnum(['high', 'medium', 'low'])
  @IsOptional()
  priority?: string;

  @IsNumber()
  @IsOptional()
  monthly_target?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
