import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FinancialStatus, FinancialType } from '../model/financial.model';

@Entity()
export class Financial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.financial, { nullable: false })
  user: User;

  @Column({
    type: 'enum',
    enum: FinancialType,
    nullable: false,
  })
  type: FinancialType;
  //se for income or expense, o status pode ser pending ou paid, se for paid, o valor é adicionado ou subtraido do saldo do usuário, se for pending, o valor não é adicionado ou subtraido do saldo do usuário e caso seja expense, o status não aparece

  @Column({
    type: 'enum',
    enum: FinancialStatus,
    nullable: true,
    default: FinancialStatus.PENDING,
  })
  status?: FinancialStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
