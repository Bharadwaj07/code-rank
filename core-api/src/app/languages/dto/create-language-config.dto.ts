export class CreateLanguageConfigDto {
  languageId!: string;
  displayName!: string;
  dockerImage!: string;
  compileCommand?: string;
  executeCommand!: string;
  timeoutSeconds?: number;
  maxMemoryMb?: number;
  isActive?: boolean;
}
