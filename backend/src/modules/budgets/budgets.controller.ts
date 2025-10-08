import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDTO } from 'src/dtos/createBudget.dto';
import { UpdateBudgetDTO } from 'src/dtos/updateBudget.dto';

@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) {}

    @Get()
    async getAllBudgets() {
        return this.budgetsService.getAllBudgets();
    }

    @Post()
    async createBudget(@Body() payload: CreateBudgetDTO) {
        return this.budgetsService.createBudget(payload);
    }

    @Get(':id')
    async getBudgetById(@Param('id') id: string) {
        return this.budgetsService.getBudgetById(id);
    }

    @Patch(':id')
    async updateBudget(@Param('id') id: string, @Body() payload: UpdateBudgetDTO) {
        return this.budgetsService.updateBudget(id, payload);
    }

    @Delete(':id')
    async deleteBudget(@Param('id') id: string) {
        return this.budgetsService.deleteBudget(id);
    }
}
