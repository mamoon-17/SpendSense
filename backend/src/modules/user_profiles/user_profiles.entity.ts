import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export enum DateFormat {
  MM_DD_YYYY = 'MM/DD/YYYY',
  DD_MM_YYYY = 'DD/MM/YYYY',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  monthly_income: string | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // 🕓 Timezone selection (example: UTC-8, UTC-7, etc.)
  @Column({ type: 'varchar', length: 10, default: 'UTC-5' })
  timezone: string;

  // 📅 Strict date format selection
  @Column({
    type: 'enum',
    enum: DateFormat,
    default: DateFormat.MM_DD_YYYY,
  })
  date_format: DateFormat;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, unknown> | null;
}
