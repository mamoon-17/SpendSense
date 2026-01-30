import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';

export class ChatWithAiDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{ role: string; content: string }>;

  @IsOptional()
  @IsObject()
  context?: any;
}
