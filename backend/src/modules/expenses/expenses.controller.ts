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
import { CreateExpenseDTO } from 'src/dtos/createExpense.dto';
import { UpdateExpenseDTO } from 'src/dtos/updateExpense.dto';
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
    return this.expensesService.getExpensesSummary(user.id, period);
  }

  @Get('search')
  async searchExpenses(@CurrentUser() user: any, @Query('q') query: string) {
    return this.expensesService.searchExpenses(user.id, query);
  }

  @Get('category/:categoryId')
  async getExpensesByCategory(
    @CurrentUser() user: any,
    @Param('categoryId') categoryId: string,
  ) {
    return this.expensesService.getExpensesByCategory(user.id, categoryId);
  }

  @Get('date-range')
  async getExpensesByDateRange(
    @CurrentUser() user: any,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.expensesService.getExpensesByDateRange(
      user.id,
      startDate,
      endDate,
    );
  }

  @Get('tags')
  async getExpensesByTags(
    @CurrentUser() user: any,
    @Query('tags') tags: string,
  ) {
    const tagsArray = tags.split(',');
    return this.expensesService.getExpensesByTags(user.id, tagsArray);
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

  @Delete(':id')
  async deleteExpense(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.deleteExpense(id, user.id);
  }
}
