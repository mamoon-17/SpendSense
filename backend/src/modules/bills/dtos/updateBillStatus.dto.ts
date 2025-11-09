import { IsEnum, IsNotEmpty } from 'class-validator';
import { BillStatus } from '../bills.entity';

export class UpdateBillStatusDTO {
  @IsEnum(BillStatus)
  @IsNotEmpty()
  status: BillStatus;
}
