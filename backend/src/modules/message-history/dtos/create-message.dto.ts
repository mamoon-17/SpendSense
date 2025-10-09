import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
