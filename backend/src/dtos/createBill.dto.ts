import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsUUID,
  IsArray,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { BillSplitType } from '../modules/bills/bills.entity';

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

  @IsEnum(BillSplitType)
  @IsNotEmpty()
  split_type: BillSplitType;

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
}
