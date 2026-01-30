import { IsObject, IsNotEmpty } from 'class-validator';

export class AnalyzeFinancialsDto {
  @IsObject()
  @IsNotEmpty()
  data: any;
}
