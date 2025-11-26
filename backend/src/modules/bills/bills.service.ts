import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill, BillSplitType } from './bills.entity';
import { BillParticipant } from './bill-participant.entity';
import { User } from '../users/users.entity';
import { Category } from '../categories/categories.entity';
import { CreateBillDTO } from './dtos/createBill.dto';
import { UpdateBillDTO } from './dtos/updateBill.dto';
import { UpdateBillStatusDTO } from './dtos/updateBillStatus.dto';
import { BillSplitStrategyFactory } from 'src/common/strategies/bill-split.strategy';
import { BillAnalyticsService } from './bill-analytics.service';
import { BillPaymentService } from './bill-payment.service';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill) private readonly billsRepo: Repository<Bill>,
    @InjectRepository(BillParticipant)
    private readonly billParticipantRepo: Repository<BillParticipant>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    private readonly billAnalyticsService: BillAnalyticsService,
    private readonly billPaymentService: BillPaymentService,
  ) {}

  async getAllBills(userId: string): Promise<Bill[]> {
    const bills = await this.billsRepo.find({
      relations: ['category', 'created_by', 'participants'],
    });

    // Filter bills where user is creator or participant
    return bills.filter(
      (bill) =>
        bill.created_by.id === userId ||
        bill.participants.some((p) => p.id === userId),
    );
  }

  // Get enhanced bills list with additional frontend info
  async getAllBillsEnhanced(userId: string): Promise<object[]> {
    const bills = await this.getAllBills(userId);

    return Promise.all(
      bills.map(async (bill) => {
        const { progress } =
          await this.billAnalyticsService.calculateBillProgress(bill.id);

        return {
          id: bill.id,
          name: bill.name,
          description: bill.description,
          total_amount: bill.total_amount,
          split_type: bill.split_type,
          split_type_display: this.billAnalyticsService.getSplitTypeDisplay(
            bill.split_type,
          ),
          due_date: bill.due_date,
          status: bill.status,
          category: bill.category,
          created_by: bill.created_by,
          participants: bill.participants,
          participant_count: bill.participants.length,
          payment_progress: progress.toFixed(2),
        };
      }),
    );
  }
  async getBillById(id: string, userId: string): Promise<Bill> {
    const bill = await this.billsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Check if user has access (is creator or participant)
    const isCreator = bill.created_by.id === userId;
    const isParticipant = bill.participants.some((p) => p.id === userId);

    if (!isCreator && !isParticipant) {
      throw new ForbiddenException('You do not have access to this bill');
    }

    return bill;
  }

  async createBill(payload: CreateBillDTO, userId: string): Promise<object> {
    // Find the category
    const category = await this.categoriesRepo.findOne({
      where: { id: payload.category_id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Find the creator (current user)
    const creator = await this.usersRepo.findOne({
      where: { id: userId },
    });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    // Find all participants
    const participants = await this.usersRepo.findByIds(
      payload.participant_ids,
    );
    if (participants.length !== payload.participant_ids.length) {
      throw new NotFoundException('Some participants not found');
    }

    // Create the bill
    const bill = this.billsRepo.create({
      name: payload.name,
      description: payload.description,
      total_amount: payload.total_amount.toString(),
      split_type: payload.split_type as BillSplitType,
      due_date: payload.due_date,
      category: category,
      created_by: creator,
      participants: participants,
      currency: payload.currency || 'USD',
    });

    const savedBill = (await this.billsRepo.save(bill)) as Bill;

    // Calculate split amount using strategy pattern
    const totalAmount = parseFloat(savedBill.total_amount);
    const participantCount = participants.length;
    const strategy = BillSplitStrategyFactory.getStrategy(savedBill.split_type);
    const splitAmount = strategy.calculateSplitAmount(
      totalAmount,
      participantCount,
    );

    // Create participant payment records
    const participantIds = participants.map((p) => p.id);
    await this.billPaymentService.createParticipantPayments(
      savedBill.id,
      participantIds,
      splitAmount,
    );

    return { msg: 'Bill created successfully' };
  }

  async updateBill(
    id: string,
    payload: UpdateBillDTO,
    userId: string,
  ): Promise<object> {
    const bill = await this.billsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Only creator can update
    if (bill.created_by.id !== userId) {
      throw new ForbiddenException('Only the creator can update this bill');
    }

    // Handle category update if provided
    if (payload.category_id) {
      const category = await this.categoriesRepo.findOne({
        where: { id: payload.category_id },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      payload.category_id = undefined; // Remove from payload
      bill.category = category;
    }

    // Handle participants update if provided
    if (payload.participant_ids) {
      const participants = await this.usersRepo.findByIds(
        payload.participant_ids,
      );
      if (participants.length !== payload.participant_ids.length) {
        throw new NotFoundException('Some participants not found');
      }
      payload.participant_ids = undefined; // Remove from payload
      bill.participants = participants;
    }

    // Use update for simple fields (like UsersService does)
    await this.billsRepo.update(id, {
      name: payload.name,
      description: payload.description,
      total_amount: payload.total_amount?.toString(),
      split_type: payload.split_type as BillSplitType,
      due_date: payload.due_date,
    });

    // Save relations if updated
    if (bill.category || bill.participants) {
      await this.billsRepo.save(bill);
    }

    return { msg: 'Bill updated successfully' };
  }

  async updateBillStatus(
    id: string,
    payload: UpdateBillStatusDTO,
    userId: string,
  ): Promise<object> {
    const bill = await this.billsRepo.findOne({
      where: { id },
      relations: ['created_by', 'participants'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Check if user has access (is creator or participant)
    const isCreator = bill.created_by.id === userId;
    const isParticipant = bill.participants.some((p) => p.id === userId);

    if (!isCreator && !isParticipant) {
      throw new ForbiddenException('You do not have access to this bill');
    }

    await this.billsRepo.update(id, { status: payload.status });
    return { msg: 'Bill status updated successfully' };
  }

  async deleteBill(id: string, userId: string): Promise<object> {
    const bill = await this.billsRepo.findOne({
      where: { id },
      relations: ['created_by'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Only creator can delete
    if (bill.created_by.id !== userId) {
      throw new ForbiddenException('Only the creator can delete this bill');
    }

    await this.billsRepo.delete(id);
    return { msg: 'Bill deleted successfully' };
  }

  // Get bills summary for dashboard
  async getBillsSummary(userId: string): Promise<object> {
    const bills = await this.getAllBills(userId);
    return this.billAnalyticsService.calculateBillsSummary(bills, userId);
  }

  // Get bills by status
  async getBillsByStatus(userId: string, status?: string): Promise<object[]> {
    const bills = await this.getAllBills(userId);

    let filteredBills: Bill[];
    if (!status || status === 'all') {
      filteredBills = bills;
    } else {
      filteredBills = bills.filter((bill) => bill.status === status);
    }

    // Enhance bills with additional info for frontend
    return Promise.all(
      filteredBills.map(async (bill) => {
        const { progress } =
          await this.billAnalyticsService.calculateBillProgress(bill.id);

        return {
          ...bill,
          participant_count: bill.participants.length,
          split_type_display: this.billAnalyticsService.getSplitTypeDisplay(
            bill.split_type,
          ),
          payment_progress: progress.toFixed(2),
        };
      }),
    );
  }

  // Get bills by category
  async getBillsByCategory(
    userId: string,
    categoryId?: string,
  ): Promise<object[]> {
    const bills = await this.getAllBills(userId);

    let filteredBills: Bill[];
    if (!categoryId || categoryId === 'all') {
      filteredBills = bills;
    } else {
      filteredBills = bills.filter((bill) => bill.category.id === categoryId);
    }

    // Enhance bills with additional info for frontend
    return Promise.all(
      filteredBills.map(async (bill) => {
        const { progress } =
          await this.billAnalyticsService.calculateBillProgress(bill.id);

        return {
          ...bill,
          participant_count: bill.participants.length,
          split_type_display: this.billAnalyticsService.getSplitTypeDisplay(
            bill.split_type,
          ),
          payment_progress: progress.toFixed(2),
        };
      }),
    );
  }

  // Get bill with payment details
  async getBillWithPaymentDetails(id: string, userId: string): Promise<object> {
    const bill = await this.getBillById(id, userId);

    const participantsDetails = await this.billPaymentService.getPaymentDetails(
      bill.id,
    );
    const { progress, paidCount, totalCount } =
      await this.billAnalyticsService.calculateBillProgress(bill.id);

    return {
      ...bill,
      participant_count: totalCount,
      split_type_display: this.billAnalyticsService.getSplitTypeDisplay(
        bill.split_type,
      ),
      participants_details: participantsDetails,
      payment_progress: progress.toFixed(2),
      paid_participants: paidCount,
      pending_participants: totalCount - paidCount,
    };
  }

  // Mark payment as paid
  async markPaymentAsPaid(
    billId: string,
    participantId: string,
    userId: string,
  ): Promise<object> {
    // Check if user has access to this bill
    await this.getBillById(billId, userId);

    await this.billPaymentService.markPaymentAsPaid(billId, participantId);

    return { msg: 'Payment marked as paid' };
  }
}
