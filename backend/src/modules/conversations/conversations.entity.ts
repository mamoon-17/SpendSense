import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { Message } from '../message-history/message-history.entity';

export enum ConversationType {
  Direct = 'direct',
  Group = 'group',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    enumName: 'conversation_type',
    nullable: false,
  })
  type: ConversationType;

  @Column('uuid', { name: 'budget_id', nullable: true })
  budget_id: string | null;

  @Column('uuid', { name: 'billSplit_id', nullable: true })
  billSplit_id: string | null;

  @ManyToMany(() => User, (user) => user.conversations_participating, { cascade: true })
  @JoinTable({
    name: 'conversation_participants',
    joinColumn: { name: 'conversation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
