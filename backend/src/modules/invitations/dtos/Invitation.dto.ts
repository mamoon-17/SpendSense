import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InvitationType } from '../invitations.entity';

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  sent_by: string;

  @IsEnum(InvitationType)
  @IsNotEmpty()
  type: InvitationType;

  @IsString()
  @IsUUID()
  target_id: string;
}
