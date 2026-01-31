import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDTO } from './dtos/createExpense.dto';
import { UpdateExpenseDTO } from './dtos/updateExpense.dto';
import { UnlinkExpenseDTO } from './dtos/unlinkExpense.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('expenses')
@UseGuards(AuthGuard)
@UseInterceptors(CurrentUserInterceptor)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async createExpense(
    @Body() payload: CreateExpenseDTO,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.createExpense(payload, user.id);
  }

  @Get()
  async getAllExpenses(@CurrentUser() user: any) {
    return this.expensesService.getAllExpenses(user.id);
  }

  @Get('summary')
  async getExpensesSummary(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    return this.expensesService.getExpenseSummary(user.id, period);
  }

  @Get('search')
  async searchExpenses(@CurrentUser() user: any, @Query('q') query: string) {
    return this.expensesService.searchExpenses(query, user.id);
  }

  @Get('category/:categoryId')
  async getExpensesByCategory(
    @CurrentUser() user: any,
    @Param('categoryId') categoryId: string,
  ) {
    return this.expensesService.getExpensesByCategory(categoryId, user.id);
  }

  @Get('date-range')
  async getExpensesByDateRange(
    @CurrentUser() user: any,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.expensesService.getExpensesByDateRange(
      new Date(startDate),
      new Date(endDate),
      user.id,
    );
  }

  @Get('tags')
  async getAllTags(@CurrentUser() user: any) {
    return this.expensesService.getAllTags(user.id);
  }

  @Get(':id')
  async getExpenseById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.getExpenseById(id, user.id);
  }

  @Patch(':id')
  async updateExpense(
    @Param('id') id: string,
    @Body() payload: UpdateExpenseDTO,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.updateExpense(id, payload, user.id);
  }

  @Patch(':id/unlink')
  async unlinkExpense(
    @Param('id') id: string,
    @Body() payload: UnlinkExpenseDTO,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.unlinkExpense(
      id,
      user.id,
      payload.budget_ids,
      payload.savings_goal_ids,
    );
  }

  @Delete(':id')
  async deleteExpense(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.deleteExpense(id, user.id);
  }
}
