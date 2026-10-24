import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FinancialStatus, FinancialType } from '../model/financial.model';
import { Project } from 'src/project/entities/project.entity';

@Entity()
export class Financial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  projectId: string;

  @ManyToOne(() => User, (user) => user.financial, { nullable: false })
  user: User;

  @ManyToOne(() => Project, (project) => project.financial, { nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: FinancialType,
    nullable: false,
  })
  type: FinancialType;
  //se for income or expense, o status pode ser pending ou paid, se for paid, o valor é adicionado no saldo do usuário, se for pending, o valor não é adicionado no saldo do usuário e caso seja expense, o status não aparece

  @Column({
    type: 'enum',
    enum: FinancialStatus,
    default: FinancialStatus.PENDING,
    nullable: false,
  })
  status: FinancialStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  value: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
