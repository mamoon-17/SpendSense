import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ConversationType } from '../conversations.entity';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ConversationType)
  type: ConversationType;

  @IsUUID('4', { each: true })
  participant_ids: string[];

  @IsOptional()
  @IsUUID()
  budget_id?: string;

  @IsOptional()
  @IsUUID()
  billSplit_id?: string;
}
