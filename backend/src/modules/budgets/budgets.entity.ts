import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from "typeorm";
import { Category } from "../categories/categories.entity";
import { User } from "../users/users.entity";

export enum BudgetPeriod {
        DAILY = 'daily',
        WEEKLY = 'weekly',
        MONTHLY = 'monthly',
        YEARLY = 'yearly'
    }

@Entity('budgets')
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
    total_amount: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    spent_amount: string;

    @Column({ type: 'enum', enum: BudgetPeriod, nullable: false })
    period: BudgetPeriod;

    @ManyToOne(() => Category, { nullable: false , onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'category' })
    category: Category;

    @Column({ type: 'date', nullable: false })
    start_date: string;

    @Column({ type: 'date', nullable: false })
    end_date: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    created_by: User;

    @ManyToMany(() => User, (user) => user.budgets_participating, { cascade: true })
    @JoinTable({
        name: 'budget_participants',
        joinColumn: { name: 'budget_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
    })
    participants: User[];
}