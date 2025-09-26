import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Bill } from "../bills/bills.entity";
import { User } from "../users/users.entity";
import { Budget } from "../budgets/budgets.entity";

export enum BillParticipantStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export enum BillParticipantRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

@Entity('bill_participants')
export class BillParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Bill, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'bill_id' })
    bill_id: Bill;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
    amount_owed: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    amount_paid: string;

    @Column({ type: 'enum', enum: BillParticipantStatus, default: BillParticipantStatus.PENDING })
    status: BillParticipantStatus;

    @Column({ type: 'enum', enum: BillParticipantRole, nullable: false })
    role: BillParticipantRole;
}