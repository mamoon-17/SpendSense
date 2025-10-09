import { IsUUID, IsNotEmpty } from 'class-validator';

export class JoinConversationDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;
}
