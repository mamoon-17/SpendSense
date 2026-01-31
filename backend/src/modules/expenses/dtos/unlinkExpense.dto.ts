import { IsUUID, IsOptional, IsArray } from 'class-validator';

export class UnlinkExpenseDTO {
  // Budget IDs to unlink from this expense (restores budget spent_amount)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  budget_ids?: string[];

  // Savings goal IDs to unlink from this expense (restores savings goal current_amount)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  savings_goal_ids?: string[];
}
