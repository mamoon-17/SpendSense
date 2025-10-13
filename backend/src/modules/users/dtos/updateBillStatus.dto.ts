import { IsEnum, IsNotEmpty } from 'class-validator';
import { BillStatus } from '../modules/bills/bills.entity';

export class UpdateBillStatusDTO {
  @IsEnum(BillStatus)
  @IsNotEmpty()
  status: BillStatus;
}
