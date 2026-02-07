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
import { LanguageConfigEntity } from '../../languages/entities/language-config.entity';

@Entity('code_submissions')
export class CodeSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'language', length: 20 })
  language!: string;

  @ManyToOne(() => LanguageConfigEntity)
  @JoinColumn({ name: 'language', referencedColumnName: 'languageId' })
  languageConfig?: LanguageConfigEntity;

  @Column({ name: 'source_code', type: 'text' })
  sourceCode!: string;

  @Column({ name: 'input_data', type: 'text', nullable: true })
  inputData?: string;

  @Column({
    name: 'status',
    length: 20,
    default: 'pending',
    type: 'varchar',
  })
  status!: 'pending' | 'running' | 'completed' | 'failed';

  @CreateDateColumn({
    name: 'submitted_at',
    type: 'timestamptz',
  })
  submittedAt!: Date;

  @Column({
    name: 'execution_started_at',
    type: 'timestamptz',
    nullable: true,
  })
  executionStartedAt?: Date;

  @Column({
    name: 'execution_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  executionCompletedAt?: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
