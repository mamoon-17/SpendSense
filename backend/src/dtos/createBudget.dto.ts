export class CreateBudgetDTO {
    name: string;
    total_amount: string;
    spent_amount?: string;
    period: string;
    category: string;
    start_date: string;
    end_date: string;
    created_by: string;
    participants?: string[];
}
