export interface CodeExecutionMessage {
  submissionId: string;
  userId: string;
  language: string;
  sourceCode: string;
  inputData?: string;
  languageConfig: {
    languageId: string;
    displayName: string;
    dockerImage: string;
    compileCommand?: string;
    executeCommand: string;
    timeoutSeconds: number;
    maxMemoryMb: number;
    isActive: boolean;
  };
}

export interface KafkaPublishOptions {
  topic?: string;
  key?: string;
}
