import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { DateFormat } from '../user_profiles.entity';

export enum TimezoneOption {
  UTC_MINUS_8 = 'UTC-8',
  UTC_MINUS_7 = 'UTC-7',
  UTC_MINUS_6 = 'UTC-6',
  UTC_MINUS_5 = 'UTC-5',
}

export class CreateUserProfileDTO {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  // match entity type: numeric stored as string
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
