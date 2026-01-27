import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config/config';
import { ExecutionJob } from '../types/execution.types';
import { logger } from '../utils/logger';

export class QueueConsumerService {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private isRunning = false;
  private processingJobs = new Map<string, boolean>();

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        multiplier: 2,
      },
      logLevel: this.getKafkaLogLevel(),
    });
  }

  async start(jobProcessor: (job: ExecutionJob) => Promise<void>): Promise<void> {
    if (this.isRunning) {
      logger.warn('Kafka consumer is already running');
      return;
    }

    try {
      this.consumer = this.kafka.consumer({
        groupId: config.kafka.groupId,
        allowAutoTopicCreation: false,
        sessionTimeout: 20000,
        heartbeatInterval: 3000,
      });

      logger.info('Connecting to Kafka...');
      await this.consumer.connect();
      logger.info(`Connected to Kafka brokers: ${config.kafka.brokers.join(', ')}`);

      // Subscribe to topic
      await this.consumer.subscribe({
        topic: config.kafka.topic,
        fromBeginning: false, // Start from latest offset
      });
      logger.info(`Subscribed to topic: ${config.kafka.topic}`);

      this.isRunning = true;
      logger.info(
        `Kafka consumer started with concurrency: ${config.queue.concurrency}`,
      );

      // Start consuming messages
      await this.consumer.run({
        partitionsConsumedConcurrently: config.queue.concurrency,
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload, jobProcessor);
        },
      });
    } catch (error) {
      logger.error('Failed to start Kafka consumer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  private async handleMessage(
    payload: EachMessagePayload,
    jobProcessor: (job: ExecutionJob) => Promise<void>,
  ): Promise<void> {
    const { topic, partition, message } = payload;
    const jobId = message.key?.toString() || `unknown-${Date.now()}`;

    try {
      const jobData = JSON.parse(message.value?.toString() || '{}') as ExecutionJob;

      if (!jobData.submissionId) {
        logger.warn('Received message without submissionId', { jobId });
        return;
      }

      logger.debug('Received job from Kafka', {
        submissionId: jobData.submissionId,
        topic,
        partition,
        offset: message.offset,
      });

      // Process job asynchronously to avoid blocking the consumer
      this.processJobAsync(jobData, jobProcessor);
    } catch (error) {
      logger.error(`Failed to parse Kafka message: ${jobId}`, error);
    }
  }

  private processJobAsync(
    job: ExecutionJob,
    jobProcessor: (job: ExecutionJob) => Promise<void>,
  ): void {
    const jobId = job.submissionId;

    // Check if we're at capacity
    if (this.processingJobs.size >= config.queue.concurrency) {
      logger.warn(
        `Job queue at capacity (${this.processingJobs.size}/${config.queue.concurrency}), will retry`,
        { submissionId: jobId },
      );
      // In a real scenario, we might want to requeue this message
      return;
    }

    this.processingJobs.set(jobId, true);

    (async () => {
      try {
        logger.info(`Processing job: ${jobId}`);
        await jobProcessor(job);
        logger.info(`Job completed: ${jobId}`);
      } catch (error) {
        logger.error(`Job failed: ${jobId}`, error);
        // Job processing error - could implement retry logic here
      } finally {
        this.processingJobs.delete(jobId);
      }
    })();
  }

  async stop(): Promise<void> {
    logger.info('Stopping Kafka consumer...');
    this.isRunning = false;

    // Wait for all in-flight jobs to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.processingJobs.size > 0) {
      if (Date.now() - startTime > timeout) {
        logger.warn(
          `Timeout waiting for ${this.processingJobs.size} jobs to complete`,
        );
        break;
      }
      await this.sleep(1000);
    }

    if (this.consumer) {
      await this.consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    }
  }

  private getKafkaLogLevel(): number {
    const levelMap: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      nothing: 4,
    };
    return levelMap[config.app.logLevel] || 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getProcessingJobsCount(): number {
    return this.processingJobs.size;
  }

  isConsumerRunning(): boolean {
    return this.isRunning;
  }
}
