import { IsUUID, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @IsNotEmpty()
  content: string;
}
