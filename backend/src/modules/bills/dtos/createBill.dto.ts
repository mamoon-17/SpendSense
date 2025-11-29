import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateBillDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  total_amount: number;

  @IsEnum(['equal', 'percentage', 'manual'])
  @IsNotEmpty()
  split_type: string;

  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  participant_ids: string[];

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsOptional()
  percentages?: number[];

  @IsArray()
  @IsOptional()
  custom_amounts?: number[];
}
