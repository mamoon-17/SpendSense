import { PartialType } from '@nestjs/mapped-types';
import { CreateBillDTO } from './createBill.dto';

export class UpdateBillDTO extends PartialType(CreateBillDTO) {}
