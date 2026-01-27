import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';
import { ExecutionJob, ExecutionResult } from '../types/execution.types';
import { DockerManager } from '../docker/docker-manager';

export class CodeExecutorService {
  private tempDirPrefix = 'coderank-executor-';
  private readonly maxOutputSize = 50 * 1024; // 50KB
  private dockerManager: DockerManager;

  constructor() {
    this.dockerManager = new DockerManager();
  }

  async execute(job: ExecutionJob): Promise<ExecutionResult> {
    const startTime = Date.now();
    const tempDir = this.createTempDir();

    try {
      logger.info(`Executing code for submission: ${job.submissionId}`, {
        language: job.language,
        tempDir,
      });

      // Write source code to file
      this.writeSourceFile(tempDir, job.language, job.sourceCode);
      const inputFilePath = job.inputData ? this.writeInputFile(tempDir, job.inputData) : null;

      // Prepare Docker binds (mount tempDir to /app)
      const binds = [`${tempDir}:/app`];

      // Compile if needed
      if (job.languageConfig.compileCommand) {
        const compilationResult = await this.dockerManager.runContainer(
          {
            image: job.languageConfig.dockerImage,
            cmd: ['/bin/bash', '-c', job.languageConfig.compileCommand],
            binds,
            workingDir: '/app',
            networkDisabled: true,
          },
          job.languageConfig.timeoutSeconds * 1000,
        );

        if (compilationResult.exitCode !== 0) {
          const executionTimeMs = Date.now() - startTime;
          logger.warn(`Compilation failed for submission: ${job.submissionId}`);
          return {
            submissionId: job.submissionId,
            stdout: '',
            stderr: '',
            compilationError: this.truncateOutput(compilationResult.stderr || compilationResult.stdout),
            runtimeError: undefined,
            executionTimeMs,
            exitCode: 1,
          };
        }

        logger.debug(`Compilation successful for submission: ${job.submissionId}`);
      }

      // Execute code
      let executeCommand = job.languageConfig.executeCommand;
      if (inputFilePath) {
        executeCommand = `${executeCommand} < input.txt`;
      }

      const executionResult = await this.dockerManager.runContainer(
        {
          image: job.languageConfig.dockerImage,
          cmd: ['/bin/bash', '-c', executeCommand],
          binds,
          workingDir: '/app',
          networkDisabled: true,
        },
        job.languageConfig.timeoutSeconds * 1000,
      );

      const executionTimeMs = Date.now() - startTime;

      logger.info(`Execution completed for submission: ${job.submissionId}`, {
        exitCode: executionResult.exitCode,
        executionTimeMs,
        stdoutSize: executionResult.stdout?.length || 0,
      });

      return {
        submissionId: job.submissionId,
        stdout: this.truncateOutput(executionResult.stdout) || '',
        stderr: this.truncateOutput(executionResult.stderr) || '',
        compilationError: undefined,
        runtimeError:
          executionResult.exitCode !== 0
            ? this.truncateOutput(executionResult.stderr || 'Runtime error')
            : undefined,
        executionTimeMs,
        exitCode: executionResult.exitCode,
      };
    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;
      logger.error(`Execution error for submission: ${job.submissionId}`, error);

      return {
        submissionId: job.submissionId,
        stdout: '',
        stderr: '',
        compilationError: undefined,
        runtimeError: error.message || 'Unknown execution error',
        executionTimeMs,
        exitCode: 1,
      };
    } finally {
      // Cleanup temporary directory
      this.cleanupTempDir(tempDir);
    }
  }

  private createTempDir(): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), this.tempDirPrefix));
    // chmod to 777 so Docker container user can read/write if mapping user IDs is tricky
    fs.chmodSync(tempDir, '777');
    logger.debug(`Created temporary directory: ${tempDir}`);
    return tempDir;
  }

  private cleanupTempDir(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        logger.debug(`Cleaned up temporary directory: ${tempDir}`);
      }
    } catch (error) {
      logger.warn(`Failed to cleanup temporary directory: ${tempDir}`, error);
    }
  }

  private writeSourceFile(tempDir: string, language: string, sourceCode: string): string {
    const fileName = this.getSourceFileName(language);
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, sourceCode, 'utf-8');
    logger.debug(`Wrote source file: ${fileName}`);
    return filePath;
  }

  private writeInputFile(tempDir: string, inputData: string): string {
    const filePath = path.join(tempDir, 'input.txt');
    fs.writeFileSync(filePath, inputData, 'utf-8');
    logger.debug(`Wrote input file`);
    return filePath;
  }

  private getSourceFileName(language: string): string {
    const extensions: Record<string, string> = {
      python: 'solution.py',
      python3: 'solution.py',
      javascript: 'solution.js',
      js: 'solution.js',
      java: 'Solution.java',
      cpp: 'solution.cpp',
      'c++': 'solution.cpp',
      c: 'solution.c',
      go: 'solution.go',
      rust: 'solution.rs',
      typescript: 'solution.ts',
    };

    return extensions[language.toLowerCase()] || `solution.${language}`;
  }

  private truncateOutput(output: string | undefined): string | undefined {
    if (!output) return undefined;
    if (output.length > this.maxOutputSize) {
      return output.substring(0, this.maxOutputSize) + `\n\n... (truncated, total size: ${output.length} bytes)`;
    }
    return output;
  }
}
