import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}