import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { SavingsGoalPriority } from '../modules/savings_goals/savings_goals.entity';

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

  @IsEnum(SavingsGoalPriority)
  @IsNotEmpty()
  priority: SavingsGoalPriority;

  @IsNumber()
  @IsOptional()
  monthly_target?: number;
}
