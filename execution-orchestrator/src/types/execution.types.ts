export interface CodeSubmission {
  id: string;
  userId: string;
  language: string;
  sourceCode: string;
  inputData?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  submittedAt: Date;
  executionStartedAt?: Date;
  executionCompletedAt?: Date;
}

export interface ExecutionJob {
  submissionId: string;
  userId: string;
  language: string;
  sourceCode: string;
  inputData?: string;
  languageConfig: LanguageConfig;
}

export interface LanguageConfig {
  languageId: string;
  displayName: string;
  dockerImage: string;
  compileCommand?: string;
  executeCommand: string;
  timeoutSeconds: number;
  maxMemoryMb: number;
  isActive: boolean;
}

export interface ExecutionResult {
  submissionId: string;
  stdout: string;
  stderr: string;
  compilationError?: string;
  runtimeError?: string;
  executionTimeMs: number;
  exitCode: number;
  memoryUsedKb?: number;
}

export interface QueueJob {
  id: string;
  data: ExecutionJob;
  attempts: number;
  progress?: number;
  returnvalue?: ExecutionResult;
  failedReason?: string;
}
