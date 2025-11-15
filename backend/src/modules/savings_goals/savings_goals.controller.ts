import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { SavingsGoalsService } from './savings_goals.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserInterceptor } from '../../common/interceptors/current-user.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSavingsGoalDTO } from './dtos/createSavingsGoal.dto';
import { UpdateSavingsGoalDTO } from './dtos/updateSavingsGoal.dto';

@Controller('savings/goals')
@UseGuards(AuthGuard)
@UseInterceptors(CurrentUserInterceptor)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  // Create a new savings goal
  @Post()
  async createSavingsGoal(
    @CurrentUser() user: any,
    @Body() body: CreateSavingsGoalDTO,
  ) {
    return this.savingsGoalsService.createSavingsGoal(user.id, body);
  }

  // Get all savings goals
  @Get()
  async getAllSavingsGoals(@CurrentUser() user: any) {
    return this.savingsGoalsService.getAllSavingsGoals(user.id);
  }

  // Get summary/statistics
  @Get('summary')
  async getSummary(@CurrentUser() user: any) {
    return this.savingsGoalsService.getSavingsGoalsSummary(user.id);
  }

  // Filter by status
  @Get('status/:status')
  async getByStatus(@CurrentUser() user: any, @Param('status') status: string) {
    return this.savingsGoalsService.getSavingsGoalsByStatus(
      user.id,
      status as any,
    );
  }

  // Filter by priority
  @Get('priority/:priority')
  async getByPriority(
    @CurrentUser() user: any,
    @Param('priority') priority: string,
  ) {
    return this.savingsGoalsService.getSavingsGoalsByPriority(
      user.id,
      priority,
    );
  }

  // Get a specific savings goal by ID
  @Get(':id')
  async getSavingsGoalById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.savingsGoalsService.getSavingsGoalById(user.id, id);
  }

  // Update a savings goal
  @Patch(':id')
  async updateSavingsGoal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateSavingsGoalDTO,
  ) {
    return this.savingsGoalsService.updateSavingsGoal(user.id, id, body);
  }

  // Add money to a savings goal
  @Patch(':id/add')
  async addToGoal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.savingsGoalsService.addToSavingsGoal(user.id, id, body.amount);
  }

  // Withdraw money from a savings goal
  @Patch(':id/withdraw')
  async withdrawFromGoal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.savingsGoalsService.withdrawFromSavingsGoal(
      user.id,
      id,
      body.amount,
    );
  }

  // Delete a savings goal
  @Delete(':id')
  async deleteSavingsGoal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.savingsGoalsService.deleteSavingsGoal(user.id, id);
  }
}
