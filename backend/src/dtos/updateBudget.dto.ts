import { IsString, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { BudgetPeriod } from '../budgets/budgets.entity';

import { PartialType } from "@nestjs/mapped-types";
import { CreateBudgetDTO } from "./createBudget.dto";

export class UpdateBudgetDTO extends PartialType(CreateBudgetDTO) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  total_amount?: string;

  @IsOptional()
  @IsString()
  spent_amount?: string;

  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @IsOptional()
  @IsString()
  category?: string; // ID of Category

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  created_by?: string; // ID of User

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[]; // Array of User IDs
}
