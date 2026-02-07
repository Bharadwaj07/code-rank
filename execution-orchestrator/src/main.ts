import { QueueConsumerService } from './workers/queue-consumer';
import { CodeExecutorService } from './workers/code-executor';
import { DatabaseService } from './services/database.service';
import { ExecutionJob } from './types/execution.types';
import { logger } from './utils/logger';
import { config } from './config/config';

// Initialize services
const kafkaConsumer = new QueueConsumerService();
const codeExecutor = new CodeExecutorService();
const database = new DatabaseService();

// Redis Consumer (COMMENTED OUT)
// import { QueueConsumerService } from './workers/queue-consumer.service';
// const redisConsumer = new QueueConsumerService();

// Job processor function
async function processJob(job: ExecutionJob): Promise<void> {
  const startTime = new Date();

  try {
    logger.info(`Processing execution job: ${job.submissionId}`, {
      language: job.language,
      userId: job.userId,
    });

    // Update status to running
    await database.updateSubmissionStatus(job.submissionId, 'running');
    await database.updateExecutionTiming(job.submissionId, startTime, undefined as any);

    // Execute code
    logger.info(`Executing code for submission: ${job.submissionId}`);
    const executionResult = await codeExecutor.execute(job);

    const completedTime = new Date();

    // Save execution result
    logger.info(`Saving execution result for submission: ${job.submissionId}`);
    await database.saveExecutionResult(job.submissionId, executionResult);

    // Update execution timing
    await database.updateExecutionTiming(job.submissionId, startTime, completedTime);

    // Mark as completed
    const success = executionResult.exitCode === 0 && !executionResult.compilationError && !executionResult.runtimeError;
    await database.markSubmissionCompleted(job.submissionId, success);

    logger.info(`Job completed successfully: ${job.submissionId}`, {
      exitCode: executionResult.exitCode,
      executionTimeMs: executionResult.executionTimeMs,
    });
  } catch (error) {
    logger.error(`Job processing failed: ${job.submissionId}`, error);

    try {
      // Mark as failed
      await database.markSubmissionCompleted(job.submissionId, false);
    } catch (dbError) {
      logger.error(`Failed to mark job as failed in database: ${job.submissionId}`, dbError);
    }
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');
  await kafkaConsumer.stop();
  await database.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the Kafka consumer (ACTIVE)
(async () => {
  try {
    logger.info(`Starting execution orchestrator (Worker: ${config.app.workerName})`);

    // Connect to database first
    logger.info('Connecting to database...');
    await database.connect();

    logger.info(`Kafka config:`, {
      brokers: config.kafka.brokers,
      topic: config.kafka.topic,
      groupId: config.kafka.groupId,
      concurrency: config.queue.concurrency,
    });

    await kafkaConsumer.start(processJob);
  } catch (error) {
    logger.error('Fatal error in Kafka consumer:', error);
    process.exit(1);
  }
})();

// (async () => {
//   try {
//     logger.info(`Starting execution orchestrator (Worker: ${config.app.workerName})`);
//     logger.info(`Queue config:`, {
//       queueName: config.queue.name,
//       concurrency: config.queue.concurrency,
//       pollInterval: config.queue.pollInterval,
//     });
//     
//     await redisConsumer.start(processJob);
//   } catch (error) {
//     logger.error('Fatal error in queue consumer:', error);
//     process.exit(1);
//   }
// })();