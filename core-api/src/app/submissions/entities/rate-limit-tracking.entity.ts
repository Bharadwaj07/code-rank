import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('rate_limit_tracking')
export class RateLimitTrackingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'request_count', default: 0 })
  requestCount!: number;

  @Column({
    name: 'window_start',
    type: 'timestamptz',
  })
  windowStart!: Date;

  @Column({
    name: 'window_end',
    type: 'timestamptz',
  })
  windowEnd!: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
