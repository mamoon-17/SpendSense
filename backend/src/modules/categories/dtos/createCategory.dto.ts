import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['bills', 'expenses', 'savings'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
