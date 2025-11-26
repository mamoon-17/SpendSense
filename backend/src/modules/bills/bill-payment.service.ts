import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillParticipant } from './bill-participant.entity';
import { Bill } from './bills.entity';

@Injectable()
export class BillPaymentService {
  constructor(
    @InjectRepository(BillParticipant)
    private readonly billParticipantRepo: Repository<BillParticipant>,
    @InjectRepository(Bill)
    private readonly billsRepo: Repository<Bill>,
  ) {}

  async createParticipantPayments(
    billId: string,
    participantIds: string[],
    splitAmount: number,
  ): Promise<void> {
    const participantPayments = participantIds.map((participantId) => {
      return this.billParticipantRepo.create({
        bill: { id: billId } as any,
        participant: { id: participantId } as any,
        amount_owed: splitAmount.toFixed(2),
        is_paid: false,
      });
    });

    await this.billParticipantRepo.save(participantPayments);
  }

  async markPaymentAsPaid(
    billId: string,
    participantId: string,
  ): Promise<void> {
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
    await this.updateBillStatusBasedOnPayments(billId);
  }

  async updateBillStatusBasedOnPayments(billId: string): Promise<void> {
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

  async getPaymentDetails(billId: string): Promise<any[]> {
    const payments = await this.billParticipantRepo.find({
      where: { bill: { id: billId } },
      relations: ['participant'],
    });

    return payments.map((payment) => ({
      id: payment.participant.id,
      name: payment.participant.name,
      username: payment.participant.username,
      amount_owed: payment.amount_owed,
      is_paid: payment.is_paid,
      paid_at: payment.paid_at,
      payment_status: payment.is_paid ? 'Paid' : 'Pending',
    }));
  }
}
