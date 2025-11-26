import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './bills.entity';
import { BillParticipant } from './bill-participant.entity';

export interface BillSummary {
  total_bills: string;
  you_owe: string;
  owed_to_you: string;
  active_bills: number;
  bills_this_month: number;
}

@Injectable()
export class BillAnalyticsService {
  constructor(
    @InjectRepository(BillParticipant)
    private readonly billParticipantRepo: Repository<BillParticipant>,
  ) {}

  async calculateBillsSummary(
    bills: Bill[],
    userId: string,
  ): Promise<BillSummary> {
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

  async calculateBillProgress(
    billId: string,
  ): Promise<{ progress: number; paidCount: number; totalCount: number }> {
    const payments = await this.billParticipantRepo.find({
      where: { bill: { id: billId } },
    });

    const paidCount = payments.filter((p) => p.is_paid).length;
    const totalCount = payments.length;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return { progress, paidCount, totalCount };
  }

  getSplitTypeDisplay(splitType: string): string {
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
}
