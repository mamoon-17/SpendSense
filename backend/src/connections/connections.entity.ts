import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export enum ConnectionStatus {
  Connected = 'connected',
  Pending = 'pending',
  Blocked = 'blocked',
}

@Entity('connections')
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id', nullable: false })
  user_id: string;

  @Column('uuid', { name: 'connected_user_id', nullable: false })
  connected_user_id: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    enumName: 'connection_status',
    default: ConnectionStatus.Pending,
  })
  status: ConnectionStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_active: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'connected_user_id' })
  connected_user: User;
}
