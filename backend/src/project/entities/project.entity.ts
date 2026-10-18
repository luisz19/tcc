import { Package } from 'src/package/entities/package.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus, ProjectType } from '../model/project.model';
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

  @Column({
    nullable: true,
  })
  packageId: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Client, (client) => client.projects, {
    nullable: false,
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'enum',
    enum: ProjectType,
    nullable: true,
    default: ProjectType.PHOTO_SESSION,
    name: 'project_type',
  })
  projectType?: ProjectType;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  startAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  endAt: Date;

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
    nullable: true,
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
