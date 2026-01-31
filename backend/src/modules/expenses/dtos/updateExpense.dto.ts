import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
} from 'class-validator';

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

  // Budget linking - array of NEW budget IDs to add (already linked ones are excluded)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  budget_ids?: string[];

  // Savings goal linking - array of NEW savings goal IDs to add (already linked ones are excluded)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  savings_goal_ids?: string[];
}
