import { IsUUID, IsOptional } from 'class-validator';

export class CreateConnectionDto {
  @IsOptional()
  @IsUUID()
  requester_id?: string;

  @IsUUID()
  receiver_id: string;
}
