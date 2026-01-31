import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['bills', 'expenses', 'savings', 'budget'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  is_custom?: boolean;
}

export class CreateCustomCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['bills', 'expenses', 'savings', 'budget'])
  @IsNotEmpty()
  type: string;
}
