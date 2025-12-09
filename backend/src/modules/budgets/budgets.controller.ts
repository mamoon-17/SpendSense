import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDTO } from '../budgets/dtos/createBudget.dto';
import { UpdateBudgetDTO } from '../budgets/dtos/updateBudget.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(AuthGuard)
@UseInterceptors(CurrentUserInterceptor)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async getAllBudgets(@CurrentUser() user: any) {
    return this.budgetsService.getAllBudgets(user.id);
  }

  @Get('enhanced/analytics')
  async getAllBudgetsEnhanced(@CurrentUser() user: any) {
    return this.budgetsService.getAllBudgetsEnhanced(user.id);
  }

  @Post()
  async createBudget(
    @Body() payload: CreateBudgetDTO,
    @CurrentUser() user: any,
  ) {
    return this.budgetsService.createBudget(payload, user.id);
  }

  @Get(':id')
  async getBudgetById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.getBudgetById(id, user.id);
  }

  @Patch(':id')
  async updateBudget(
    @Param('id') id: string,
    @Body() payload: UpdateBudgetDTO,
    @CurrentUser() user: any,
  ) {
    return this.budgetsService.updateBudget(id, payload, user.id);
  }

  @Delete(':id')
  async deleteBudget(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.deleteBudget(id, user.id);
  }
}
