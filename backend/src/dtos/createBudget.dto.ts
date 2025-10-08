import { IsString, IsEnum, IsDateString, IsOptional, IsArray } from 'class-validator';
import { BudgetPeriod } from '../modules/budgets/budgets.entity';

export class CreateBudgetDTO {
  @IsString()
  name: string;

  @IsString()
  total_amount: string;

  @IsOptional()
  @IsString()
  spent_amount?: string;

  @IsEnum(BudgetPeriod)
  period: BudgetPeriod;

  @IsString()
  category: string; // Category ID

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsString()
  created_by: string; // User ID

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[]; // Array of User IDs
}
