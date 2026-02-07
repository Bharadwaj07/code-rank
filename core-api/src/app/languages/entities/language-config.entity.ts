import 'reflect-metadata';
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('language_configs')
export class LanguageConfigEntity {
  @PrimaryColumn({ name: 'language_id', length: 20 })
  languageId!: string;

  @Column({ name: 'display_name', length: 50 })
  displayName!: string;

  @Column({ name: 'docker_image', length: 255 })
  dockerImage!: string;

  @Column({ name: 'compile_command', type: 'text', nullable: true })
  compileCommand?: string;

  @Column({ name: 'execute_command', type: 'text' })
  executeCommand!: string;

  @Column({ name: 'timeout_seconds', default: 10 })
  timeoutSeconds!: number;

  @Column({ name: 'max_memory_mb', default: 256 })
  maxMemoryMb!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
