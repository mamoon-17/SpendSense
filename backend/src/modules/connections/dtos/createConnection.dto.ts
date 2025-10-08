import { IsUUID } from 'class-validator';

export class CreateConnectionDto {
  @IsUUID()
  requester_id: string;

  @IsUUID()
  receiver_id: string;
}
