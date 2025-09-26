import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity';
import { User } from '../users/users.entity';

@Entity('conversation_participants')
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'conversation_id', nullable: false })
  conversation_id: string;

  @Column('uuid', { name: 'user_id', nullable: false })
  user_id: string;

  @Column({ type: 'timestamp', nullable: true })
  last_read_at: Date | null;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
