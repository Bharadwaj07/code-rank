import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_name', length: 50, unique: true })
  userName!: string;

  @Column({ name: 'email', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  hashedPassword!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({
    name: 'rate_limit_tier',
    length: 20,
    default: 'basic',
  })
  rateLimitTier!: string;

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