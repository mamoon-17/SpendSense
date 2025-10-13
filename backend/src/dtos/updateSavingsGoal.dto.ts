import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { SavingsGoalPriority } from '../modules/savings_goals/savings_goals.entity';

export class UpdateSavingsGoalDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  target_amount?: number;

  @IsNumber()
  @IsOptional()
  current_amount?: number;

  @IsDateString()
  @IsOptional()
  target_date?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsEnum(SavingsGoalPriority)
  @IsOptional()
  priority?: SavingsGoalPriority;

  @IsNumber()
  @IsOptional()
  monthly_target?: number;
}
