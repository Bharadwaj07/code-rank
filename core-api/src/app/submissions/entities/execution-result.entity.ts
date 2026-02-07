import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CodeSubmissionEntity } from './code-submission.entity';

@Entity('execution_results')
export class ExecutionResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'submission_id', type: 'uuid', unique: true })
  submissionId!: string;

  @OneToOne(() => CodeSubmissionEntity)
  @JoinColumn({ name: 'submission_id' })
  submission?: CodeSubmissionEntity;

  @Column({ name: 'stdout', type: 'text', nullable: true })
  stdout?: string;

  @Column({ name: 'stderr', type: 'text', nullable: true })
  stderr?: string;

  @Column({ name: 'compilation_error', type: 'text', nullable: true })
  compilationError?: string;

  @Column({ name: 'runtime_error', type: 'text', nullable: true })
  runtimeError?: string;

  @Column({ name: 'execution_time_ms', nullable: true })
  executionTimeMs?: number;

  @Column({ name: 'memory_used_kb', nullable: true })
  memoryUsedKb?: number;

  @Column({ name: 'exit_code', nullable: true })
  exitCode?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
