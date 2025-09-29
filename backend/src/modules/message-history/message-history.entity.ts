import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "../conversations/conversations.entity";
import { User } from "../users/users.entity";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Conversation, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @Column({ type: 'text', nullable: false })
    content: string;

    @CreateDateColumn({ type: 'timestamp', name: 'sent_at' })
    sent_at: Date;
}


