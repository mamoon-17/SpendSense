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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority } from '../notifications/notifications.entity';

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
    private readonly notificationsService: NotificationsService,
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

        // Fetch BillParticipant data with payment information
        const billParticipants = await this.billParticipantRepo.find({
          where: { bill: { id: bill.id } },
          relations: ['participant'],
        });

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
          participants: billParticipants.map((bp) => ({
            id: bp.participant.id,
            name: bp.participant.name,
            username: bp.participant.username,
            amount_owed: bp.amount_owed,
            status: bp.is_paid ? 'paid' : 'pending',
            paid_at: bp.paid_at,
          })),
          participant_count: billParticipants.length,
          payment_progress: progress.toFixed(2),
        };
      }),
    );
  }
  async getBillById(id: string, userId: string): Promise<any> {
    const bill = await this.billsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Fetch BillParticipant data with payment information
    const billParticipants = await this.billParticipantRepo.find({
      where: { bill: { id: bill.id } },
      relations: ['participant'],
    });

    // Check if user has access to this bill before returning
    const isCreator = bill.created_by.id === userId;
    const isParticipant = billParticipants.some(
      (bp) => bp.participant.id === userId,
    );

    if (!isCreator && !isParticipant) {
      throw new NotFoundException('Bill not found or access denied');
    }

    return {
      ...bill,
      participants: billParticipants.map((bp) => ({
        id: bp.participant.id,
        name: bp.participant.name,
        username: bp.participant.username,
        amount_owed: bp.amount_owed,
        status: bp.is_paid ? 'paid' : 'pending',
        paid_at: bp.paid_at,
      })),
    };
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

    // Ensure the bill creator is always included as a participant
    const creatorAlreadyIncluded = participants.some((p) => p.id === userId);
    let allParticipantIds = [...payload.participant_ids];

    if (!creatorAlreadyIncluded) {
      participants.push(creator);
      allParticipantIds.push(userId);

      // Extend percentages and custom amounts arrays if creator wasn't originally included
      if (payload.percentages && payload.percentages.length > 0) {
        // Add equal percentage for creator if not specified
        const remainingPercentage =
          100 - payload.percentages.reduce((sum, p) => sum + (p || 0), 0);
        payload.percentages.push(
          remainingPercentage > 0 ? remainingPercentage : 0,
        );
      }

      if (payload.custom_amounts && payload.custom_amounts.length > 0) {
        // Add remaining amount for creator if not specified
        const totalAmount = parseFloat(payload.total_amount.toString());
        const usedAmount = payload.custom_amounts.reduce(
          (sum, a) => sum + (a || 0),
          0,
        );
        payload.custom_amounts.push(totalAmount - usedAmount);
      }
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

    // Calculate split amounts based on split type
    const totalAmount = parseFloat(savedBill.total_amount);
    const participantCount = participants.length;
    const strategy = BillSplitStrategyFactory.getStrategy(savedBill.split_type);

    // Create participant payment records with calculated amounts
    const participantPayments = participants.map((participant, index) => {
      let amount: number;

      switch (savedBill.split_type) {
        case 'percentage':
          if (payload.percentages && payload.percentages[index] !== undefined) {
            const percentageStrategy = strategy as any;
            amount = percentageStrategy.calculateIndividualAmount
              ? percentageStrategy.calculateIndividualAmount(
                  totalAmount,
                  payload.percentages[index],
                )
              : totalAmount / participantCount;
          } else {
            amount = totalAmount / participantCount; // Default to equal if no percentage provided
          }
          break;
        case 'custom':
        case 'manual':
          if (
            payload.custom_amounts &&
            payload.custom_amounts[index] !== undefined
          ) {
            amount = payload.custom_amounts[index];
          } else {
            amount = totalAmount / participantCount; // Default to equal if no custom amount provided
          }
          break;
        case 'equal':
        default:
          amount = strategy.calculateSplitAmount(totalAmount, participantCount);
          break;
      }

      return {
        participantId: participant.id,
        amount: amount,
      };
    });

    // Create the payment records
    await this.billPaymentService.createParticipantPaymentsWithAmounts(
      savedBill.id,
      participantPayments,
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

  // Request payment from selected users
  async requestPayment(
    billId: string,
    userIds: string[],
    requesterId: string,
    message?: string,
  ): Promise<object> {
    // Verify the requester has access to this bill
    const bill = await this.getBillById(billId, requesterId);

    // Get the requester's details
    const requester = await this.usersRepo.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // Verify that all requested users are participants in this bill
    const billParticipants = await this.billParticipantRepo.find({
      where: { bill: { id: billId } },
      relations: ['participant'],
    });

    const participantUserIds = billParticipants.map((p) => p.participant.id);
    const invalidUserIds = userIds.filter(
      (id) => !participantUserIds.includes(id),
    );

    if (invalidUserIds.length > 0) {
      throw new ForbiddenException(
        'Some selected users are not participants in this bill',
      );
    }

    // Send notifications to selected users
    const notificationPromises = userIds.map(async (userId) => {
      const customMessage = message ? ` Message: "${message}"` : '';

      await this.notificationsService.createNotification(
        userId,
        'Payment Request',
        `${requester.name || requester.username} has requested payment for "${bill.name}".${customMessage}`,
        NotificationPriority.HIGH,
        {
          type: 'payment_request',
          billId: billId,
          requesterId: requesterId,
          billName: bill.name,
          amount: bill.total_amount,
          currency: bill.currency,
        },
      );
    });

    await Promise.all(notificationPromises);

    return {
      msg: 'Payment request sent successfully',
      sentTo: userIds.length,
      billName: bill.name,
    };
  }
}
