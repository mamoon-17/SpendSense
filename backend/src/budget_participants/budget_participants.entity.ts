import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "../users/users.entity";
import { Budget } from "../budgets/budgets.entity";

export enum BudgetParticipantRole {
    OWNER = 'owner',
    EDITOR = 'editor',
    VIEWER = 'viewer'
}

@Entity('budget_participants')
export class BudgetParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Budget, { nullable: false, onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'budget_id' })
    budget_id: Budget;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' , onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    @Column({ type: 'enum', enum: BudgetParticipantRole, nullable: false })
    role: BudgetParticipantRole;

    @CreateDateColumn({ type: 'timestamp', name: 'joined_at', default: () => 'CURRENT_TIMESTAMP' })
    joined_at: Date;

}