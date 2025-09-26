import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Category } from "../categories/categories.entity";
import { User } from "../users/users.entity";

export enum BillSplitType {
    EQUAL = 'equal',
    PERCENTAGE = 'percentage',
    MANUAL = 'manual'
}

export enum BillStatus {
    PENDING = 'pending',
    PARTIAL = 'partial',
    COMPLETED = 'completed'
}

@Entity('bills')
export class Bill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
    total_amount: string;

    @Column({ type: 'enum', enum: BillSplitType, nullable: false})
    split_type: BillSplitType;

    @Column({ type: 'date', nullable: false })
    due_date: string;

    @Column({ type: 'enum', enum: BillStatus, default: BillStatus.PENDING})
    status: BillStatus;

    @ManyToOne(() => Category, { nullable: false,  onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'category' })
    category: Category;

    @ManyToOne(() => User, { nullable: false,  onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    created_by: User;
}