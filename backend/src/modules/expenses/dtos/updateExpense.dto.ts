import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DistributionType, LinkItemDTO } from './createExpense.dto';

export class UpdateExpenseDTO {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

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

  // Legacy support - array of NEW budget IDs to add (already linked ones are excluded)
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

  // Legacy support - array of NEW savings goal IDs to add (already linked ones are excluded)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  savings_goal_ids?: string[];
}
