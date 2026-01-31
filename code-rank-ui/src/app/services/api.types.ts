export interface CreateSubmissionDto {
    language: string;
    sourceCode: string;
    inputData?: string;
}

export interface Submission {
    id: string;
    userId: string;
    language: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
}

export interface SubmissionDetail {
    submissionId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    language: string;
    sourceCode: string;
    stdout?: string;
    stderr?: string;
    compilationError?: string;
    runtimeError?: string;
    executionTimeMs?: number;
    memoryUsedKb?: number;
    exitCode?: number;
    submittedAt: string;
    completedAt?: string;
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

export interface CreateLanguageConfigDto {
    languageId: string;
    displayName: string;
    dockerImage: string;
    compileCommand?: string;
    executeCommand: string;
    timeoutSeconds?: number;
    maxMemoryMb?: number;
    isActive?: boolean;
}
