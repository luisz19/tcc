import { Package } from 'src/package/entities/package.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '../model/project.model';
import { Client } from 'src/clients/entities/client.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
  })
  user: User;

  @ManyToOne(() => Package, (pkg) => pkg.projects, {
    nullable: true,
  })
  package: Package | null;

  @ManyToOne(() => Client, (client) => client.projects, {
    nullable: false,
  })
  client: Client;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  date: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  local: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  agreed_price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
