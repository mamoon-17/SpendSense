import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity('MessageHistory')
export class MessageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('uuid')
  sender_id: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'text' })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'MessageSentAt', default: () => 'CURRENT_TIMESTAMP' })
  MessageSentAt: Date;
}