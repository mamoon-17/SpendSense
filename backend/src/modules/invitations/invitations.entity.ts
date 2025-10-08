import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum InvitationType {
  Budget = 'budget',
  Bill = 'bill',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who receives the invitation
  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  // Who sent the invitation
  @Column('uuid', { name: 'sent_by', nullable: false })
  sent_by: string;

  // Status of the invitation
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    enumName: 'invitation_status',
    default: InvitationStatus.Pending,
  })
  status: InvitationStatus;

  // Type of invitation: / budget / bill
  @Column({
    type: 'enum',
    enum: InvitationType,
    enumName: 'invitation_type',
  })
  type: InvitationType;

  // Generic reference to target entity (budget, bill)
  @Column('uuid', { name: 'target_id', nullable: false })
  target_id: string;

  // Timestamp when invitation was sent
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sent_at: Date;

  // Expiration timestamp
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "CURRENT_TIMESTAMP + INTERVAL '7 days'",
  })
  expires_at: Date;

  // Timestamp when the invitation was accepted
  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;
}
