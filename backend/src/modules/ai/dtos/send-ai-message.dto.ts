import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendAiMessageDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
