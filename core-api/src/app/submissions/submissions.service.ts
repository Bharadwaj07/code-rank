import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeSubmissionEntity } from './entities/code-submission.entity';
import { ExecutionResultEntity } from './entities/execution-result.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { SubmissionResultDto } from './dto/submission-result.dto';
import { KafkaService } from '../kafka/kafka.service';
import { LanguagesService } from '../languages/languages.service';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(CodeSubmissionEntity)
    private readonly submissionRepository: Repository<CodeSubmissionEntity>,
    @InjectRepository(ExecutionResultEntity)
    private readonly resultRepository: Repository<ExecutionResultEntity>,
    private readonly kafkaService: KafkaService,
    private readonly languagesService: LanguagesService,
    private readonly rateLimitService: RateLimitService,
  ) { }

  async create(
    userId: string,
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    // Check rate limiting
    const isAllowed = await this.rateLimitService.checkAndIncrement(
      userId,
      1000,
      60,
    );

    if (!isAllowed) {
      throw new BadRequestException(
        'Rate limit exceeded. Maximum 10 submissions per hour.',
      );
    }

    // Validate language
    const language = await this.languagesService.findOne(
      createSubmissionDto.language,
    );
    if (!language || !language.isActive) {
      throw new BadRequestException(
        `Language ${createSubmissionDto.language} is not supported or is inactive`,
      );
    }

    // Create submission
    const submission = this.submissionRepository.create({
      userId,
      language: createSubmissionDto.language,
      sourceCode: createSubmissionDto.sourceCode,
      inputData: createSubmissionDto.inputData,
      status: 'pending',
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // Publish to Kafka for execution
    try {
      await this.kafkaService.publishCodeExecution({
        submissionId: savedSubmission.id,
        userId,
        language: createSubmissionDto.language,
        sourceCode: createSubmissionDto.sourceCode,
        inputData: createSubmissionDto.inputData,
        languageConfig: {
          languageId: language.languageId,
          displayName: language.displayName,
          dockerImage: language.dockerImage,
          compileCommand: language.compileCommand,
          executeCommand: language.executeCommand,
          timeoutSeconds: language.timeoutSeconds,
          maxMemoryMb: language.maxMemoryMb,
          isActive: language.isActive,
        },
      });
    } catch (error) {
      // If Kafka publish fails, update submission status to failed
      await this.updateStatus(savedSubmission.id, 'failed');
      throw new BadRequestException(
        'Failed to queue code execution. Please try again later.',
      );
    }

    return {
      submissionId: savedSubmission.id,
      status: savedSubmission.status,
      message: 'Code submitted successfully',
    };
  }

  async findAll(userId: string) {
    return await this.submissionRepository.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
  }

  async findOne(submissionId: string): Promise<SubmissionResultDto> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const result = await this.resultRepository.findOne({
      where: { submissionId },
    });

    return {
      submissionId: submission.id,
      status: submission.status,
      language: submission.language,
      sourceCode: submission.sourceCode,
      inputData: submission.inputData,
      stdout: result?.stdout,
      stderr: result?.stderr,
      compilationError: result?.compilationError,
      runtimeError: result?.runtimeError,
      executionTimeMs: result?.executionTimeMs,
      memoryUsedKb: result?.memoryUsedKb,
      exitCode: result?.exitCode,
      submittedAt: submission.submittedAt,
      completedAt: submission.executionCompletedAt,
    };
  }

  async updateStatus(
    submissionId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
  ) {
    return await this.submissionRepository.update(submissionId, { status });
  }

  async updateExecutionTiming(
    submissionId: string,
    executionStartedAt?: Date,
    executionCompletedAt?: Date,
  ) {
    return await this.submissionRepository.update(submissionId, {
      executionStartedAt,
      executionCompletedAt,
    });
  }

  async saveExecutionResult(
    submissionId: string,
    resultData: Partial<ExecutionResultEntity>,
  ) {
    const existingResult = await this.resultRepository.findOne({
      where: { submissionId },
    });

    if (existingResult) {
      await this.resultRepository.update(submissionId, resultData);
      return await this.resultRepository.findOne({
        where: { submissionId },
      });
    }

    const result = this.resultRepository.create({
      submissionId,
      ...resultData,
    });

    return await this.resultRepository.save(result);
  }
}
