import { Exclude, Expose } from 'class-transformer';
import { Project } from 'src/project/entities/project.entity';
import type { Client } from 'src/clients/entities/client.entity';
import { Package } from 'src/package/entities/package.entity';

import {
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Entity } from 'typeorm';
import { Financial } from 'src/financial/entities/financial.entity';

@Entity()
@Exclude()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @OneToMany('Client', 'user')
  clients: Client[];

  @OneToMany('Project', 'user')
  projects: Project[];

  @OneToMany('Package', 'user')
  packages: Package[];

  @OneToMany('Financial', 'user')
  financial: Financial[];

  @Column()
  @Expose()
  name: string;

  @Column()
  @Expose()
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;
}
