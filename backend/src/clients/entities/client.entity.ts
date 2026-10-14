import { Project } from 'src/project/entities/project.entity';
import type { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonType } from '../model/clients.model';

@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne('User', 'clients', { nullable: false })
  user: User;

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    name: 'telephone',
  })
  phone: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  address: string;

  @Column({
    type: 'enum',
    enum: PersonType,
    default: PersonType.INDIVIDUAL,
    nullable: true,
    name: 'person_type',
  })
  personType: PersonType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
