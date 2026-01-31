import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity';
import { User } from '../users/users.entity';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
@Index(['conversation', 'sent_at']) // Index for fetching conversation messages by date
@Index(['sender', 'sent_at']) // Index for user's messages
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, {
    nullable: true, // Allow null for AI messages
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User | null;

  // Store sender_id as string for AI messages (when sender relation is null)
  @Column({ type: 'varchar', nullable: true, name: 'ai_sender_id' })
  ai_sender_id: string | null;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'text', default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'sent_at' })
  sent_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
