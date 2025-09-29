import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, OneToMany } from "typeorm";
import { Bill } from "../bills/bills.entity";
import { Budget } from "../budgets/budgets.entity";
import { Conversation } from "../conversations/conversations.entity";
import { Message } from "../message-history/message-history.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    name: string;

    @Column({type: 'varchar', length: 255, unique: true, nullable: false})
    email: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    password_hash: string;

    @ManyToMany(() => Bill, (bill) => bill.participants)
    bills_participating: Bill[];

    @ManyToMany(() => Budget, (budget) => budget.participants)
    budgets_participating: Budget[];

    @ManyToMany(() => Conversation, (conversation) => conversation.participants)
    conversations_participating: Conversation[];

    @OneToMany(() => Message, (message) => message.sender)
    messages_sent: Message[];
}