import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'budget | expenses | savings | bills',
  })
  type: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string;
}
