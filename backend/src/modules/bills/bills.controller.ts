import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDTO } from 'src/dtos/createBill.dto';
import { UpdateBillDTO } from 'src/dtos/updateBill.dto';
import { UpdateBillStatusDTO } from 'src/dtos/updateBillStatus.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('bills')
@UseGuards(AuthGuard)
@UseInterceptors(CurrentUserInterceptor)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  async createBill(@Body() payload: CreateBillDTO, @CurrentUser() user: any) {
    return this.billsService.createBill(payload, user.id);
  }

  @Get()
  async getAllBills(@CurrentUser() user: any) {
    return this.billsService.getAllBillsEnhanced(user.id);
  }

  @Get(':id')
  async getBillById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billsService.getBillById(id, user.id);
  }

  @Patch(':id')
  async updateBill(
    @Param('id') id: string,
    @Body() payload: UpdateBillDTO,
    @CurrentUser() user: any,
  ) {
    return this.billsService.updateBill(id, payload, user.id);
  }

  @Patch(':id/status')
  async updateBillStatus(
    @Param('id') id: string,
    @Body() payload: UpdateBillStatusDTO,
    @CurrentUser() user: any,
  ) {
    return this.billsService.updateBillStatus(id, payload, user.id);
  }

  @Delete(':id')
  async deleteBill(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billsService.deleteBill(id, user.id);
  }

  @Get('summary/dashboard')
  async getBillsSummary(@CurrentUser() user: any) {
    return this.billsService.getBillsSummary(user.id);
  }

  @Get('status/:status')
  async getBillsByStatus(
    @Param('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.billsService.getBillsByStatus(user.id, status);
  }

  @Get('category/:categoryId')
  async getBillsByCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: any,
  ) {
    return this.billsService.getBillsByCategory(user.id, categoryId);
  }

  @Get(':id/details')
  async getBillWithPaymentDetails(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.billsService.getBillWithPaymentDetails(id, user.id);
  }

  @Patch(':billId/payment/:participantId/mark-paid')
  async markPaymentAsPaid(
    @Param('billId') billId: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    return this.billsService.markPaymentAsPaid(billId, participantId, user.id);
  }
}
