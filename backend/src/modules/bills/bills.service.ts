import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './bills.entity';
import { BillParticipant } from './bill-participant.entity';
import { User } from '../users/users.entity';
import { Category } from '../categories/categories.entity';
import { CreateBillDTO } from 'src/dtos/createBill.dto';
import { UpdateBillDTO } from 'src/dtos/updateBill.dto';
import { UpdateBillStatusDTO } from 'src/dtos/updateBillStatus.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill) private readonly billsRepo: Repository<Bill>,
    @InjectRepository(BillParticipant)
    private readonly billParticipantRepo: Repository<BillParticipant>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
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
        const payments = await this.billParticipantRepo.find({
          where: { bill: { id: bill.id } },
        });

        const paidCount = payments.filter((p) => p.is_paid).length;
        const progress = (paidCount / payments.length) * 100;

        return {
          id: bill.id,
          name: bill.name,
          description: bill.description,
          total_amount: bill.total_amount,
          split_type: bill.split_type,
          split_type_display: this.getSplitTypeDisplay(bill.split_type),
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
      split_type: payload.split_type,
      due_date: payload.due_date,
      category: category,
      created_by: creator,
      participants: participants,
    });

    const savedBill = await this.billsRepo.save(bill);

    // Calculate split amount
    const totalAmount = parseFloat(savedBill.total_amount);
    const participantCount = participants.length;
    let splitAmount: number;

    if (savedBill.split_type === 'equal') {
      splitAmount = totalAmount / participantCount;
    } else {
      // For now, default to equal split
      // You can implement percentage and manual split later
      splitAmount = totalAmount / participantCount;
    }

    // Create participant payment records
    const participantPayments = participants.map((participant) => {
      return this.billParticipantRepo.create({
        bill: savedBill,
        participant: participant,
        amount_owed: splitAmount.toFixed(2),
        is_paid: false,
      });
    });

    await this.billParticipantRepo.save(participantPayments);

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
      split_type: payload.split_type,
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

    let totalBills = 0;
    let youOwe = 0;
    let owedToYou = 0;
    let activeBills = 0;

    for (const bill of bills) {
      const amount = parseFloat(bill.total_amount);
      const isCreator = bill.created_by.id === userId;

      totalBills += amount;

      if (bill.status !== 'completed') {
        activeBills++;
      }

      // Get participant payment for this user
      const userPayment = await this.billParticipantRepo.findOne({
        where: { bill: { id: bill.id }, participant: { id: userId } },
      });

      if (userPayment) {
        const owedAmount = parseFloat(userPayment.amount_owed);
        if (!userPayment.is_paid) {
          youOwe += owedAmount;
        }
      }

      // If user is creator, calculate what others owe
      if (isCreator) {
        const allPayments = await this.billParticipantRepo.find({
          where: { bill: { id: bill.id } },
          relations: ['participant'],
        });

        for (const payment of allPayments) {
          if (payment.participant.id !== userId && !payment.is_paid) {
            owedToYou += parseFloat(payment.amount_owed);
          }
        }
      }
    }

    const now = new Date();
    const billsThisMonth = bills.filter((b) => {
      const billDate = new Date(b.due_date);
      return (
        billDate.getMonth() === now.getMonth() &&
        billDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      total_bills: totalBills.toFixed(2),
      you_owe: youOwe.toFixed(2),
      owed_to_you: owedToYou.toFixed(2),
      active_bills: activeBills,
      bills_this_month: billsThisMonth,
    };
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
        const payments = await this.billParticipantRepo.find({
          where: { bill: { id: bill.id } },
        });

        const paidCount = payments.filter((p) => p.is_paid).length;
        const progress = (paidCount / payments.length) * 100;

        return {
          ...bill,
          participant_count: bill.participants.length,
          split_type_display: this.getSplitTypeDisplay(bill.split_type),
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
        const payments = await this.billParticipantRepo.find({
          where: { bill: { id: bill.id } },
        });

        const paidCount = payments.filter((p) => p.is_paid).length;
        const progress = (paidCount / payments.length) * 100;

        return {
          ...bill,
          participant_count: bill.participants.length,
          split_type_display: this.getSplitTypeDisplay(bill.split_type),
          payment_progress: progress.toFixed(2),
        };
      }),
    );
  }

  // Helper method to format split type for display
  private getSplitTypeDisplay(splitType: string): string {
    switch (splitType) {
      case 'equal':
        return 'Equal Split';
      case 'percentage':
        return 'Percentage Split';
      case 'manual':
        return 'Manual Split';
      default:
        return 'Equal Split';
    }
  }

  // Get bill with payment details
  async getBillWithPaymentDetails(id: string, userId: string): Promise<object> {
    const bill = await this.getBillById(id, userId);

    // Get all participant payments for this bill
    const payments = await this.billParticipantRepo.find({
      where: { bill: { id: bill.id } },
      relations: ['participant'],
    });

    // Map payments to include participant details with status
    const participantsDetails = payments.map((payment) => ({
      id: payment.participant.id,
      name: payment.participant.name,
      username: payment.participant.username,
      amount_owed: payment.amount_owed,
      is_paid: payment.is_paid,
      paid_at: payment.paid_at,
      payment_status: payment.is_paid ? 'Paid' : 'Pending',
    }));

    // Calculate payment progress
    const paidCount = payments.filter((p) => p.is_paid).length;
    const totalParticipants = payments.length;
    const progress = (paidCount / totalParticipants) * 100;

    return {
      ...bill,
      participant_count: totalParticipants,
      split_type_display: this.getSplitTypeDisplay(bill.split_type),
      participants_details: participantsDetails,
      payment_progress: progress.toFixed(2),
      paid_participants: paidCount,
      pending_participants: totalParticipants - paidCount,
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

    const payment = await this.billParticipantRepo.findOne({
      where: {
        bill: { id: billId },
        participant: { id: participantId },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    payment.is_paid = true;
    payment.paid_at = new Date();

    await this.billParticipantRepo.save(payment);

    // Update bill status based on payments
    await this.updateBillStatusBasedOnPayments(billId);

    return { msg: 'Payment marked as paid' };
  }

  // Helper method to update bill status based on payments
  private async updateBillStatusBasedOnPayments(billId: string): Promise<void> {
    const payments = await this.billParticipantRepo.find({
      where: { bill: { id: billId } },
    });

    const allPaid = payments.every((p) => p.is_paid);
    const somePaid = payments.some((p) => p.is_paid);

    let newStatus: string;
    if (allPaid) {
      newStatus = 'completed';
    } else if (somePaid) {
      newStatus = 'partial';
    } else {
      newStatus = 'pending';
    }

    await this.billsRepo.update(billId, { status: newStatus as any });
  }
}
