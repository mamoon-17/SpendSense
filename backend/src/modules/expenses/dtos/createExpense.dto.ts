import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Distribution types for linking expenses to budgets/savings goals
export enum DistributionType {
  NONE = 'none',
  MANUAL = 'manual',
  EQUAL_SPLIT = 'equal_split',
  HALF = 'half',
}

// DTO for individual budget/savings goal link with custom amount
export class LinkItemDTO {
  @IsUUID()
  id: string;

  @IsNumber()
  @IsOptional()
  amount?: number; // Custom amount for manual distribution
}

export class CreateExpenseDTO {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  // Budget distribution type
  @IsEnum(DistributionType)
  @IsOptional()
  budget_distribution?: DistributionType;

  // Budget linking - array of budget objects with optional custom amounts
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkItemDTO)
  @IsOptional()
  budget_links?: LinkItemDTO[];

  // Legacy support - array of budget IDs (will use full amount)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  budget_ids?: string[];

  // Savings goal distribution type
  @IsEnum(DistributionType)
  @IsOptional()
  savings_goal_distribution?: DistributionType;

  // Savings goal linking - array of savings goal objects with optional custom amounts
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkItemDTO)
  @IsOptional()
  savings_goal_links?: LinkItemDTO[];

  // Legacy support - array of savings goal IDs (will use full amount)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  savings_goal_ids?: string[];
}
