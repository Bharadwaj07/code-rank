export class SubmissionResultDto {
  submissionId!: string;
  status!: string;
  language!: string;
  sourceCode!: string;
  inputData?: string;
  stdout?: string;
  stderr?: string;
  compilationError?: string;
  runtimeError?: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  exitCode?: number;
  submittedAt!: Date;
  completedAt?: Date;
}
