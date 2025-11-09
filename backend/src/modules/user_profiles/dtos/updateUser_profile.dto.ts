import { IsEnum, IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { DateFormat } from '../user_profiles.entity';
import { TimezoneOption } from './createUser_profile.dto';

export class UpdateUserProfileDTO {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monthly_income must be a decimal with up to 2 digits after decimal' })
  monthly_income?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsEnum(TimezoneOption)
  timezone?: TimezoneOption;

  @IsOptional()
  @IsEnum(DateFormat)
  date_format?: DateFormat;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
