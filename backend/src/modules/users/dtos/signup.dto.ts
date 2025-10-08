import { IsString, MinLength } from 'class-validator';

export class SignupDTO {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
