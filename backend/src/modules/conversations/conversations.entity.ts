import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
