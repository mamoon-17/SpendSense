import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateCategoryDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['bills', 'expenses', 'savings'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
