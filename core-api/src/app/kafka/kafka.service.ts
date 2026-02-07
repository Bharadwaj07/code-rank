import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { CodeExecutionMessage } from '../../shared/types/kafka.types';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaService.name);
  private readonly topic = 'code-execution-jobs';

  constructor(private configService: ConfigService) {
    const kafkaBrokers = this.configService.get<string>('KAFKA_BROKERS') || 'localhost:9092';
    
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID') || 'core-api',
      brokers: kafkaBrokers.split(','),
      connectionTimeout: 3000,
      requestTimeout: 25000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        multiplier: 2,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Connecting to Kafka...');
      await this.producer.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting from Kafka...');
      await this.producer.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka', error);
    }
  }

  async publishCodeExecution(message: CodeExecutionMessage): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: message.submissionId,
            value: JSON.stringify(message),
            headers: {
              'correlation-id': message.submissionId,
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });

      this.logger.debug(
        `Published code execution job to Kafka: ${message.submissionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish code execution to Kafka: ${message.submissionId}`,
        error,
      );
      throw error;
    }
  }

  async publishBatch(messages: CodeExecutionMessage[]): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: messages.map((msg) => ({
          key: msg.submissionId,
          value: JSON.stringify(msg),
          headers: {
            'correlation-id': msg.submissionId,
            'timestamp': Date.now().toString(),
          },
        })),
      });

      this.logger.debug(
        `Published ${messages.length} code execution jobs to Kafka`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish batch to Kafka`,
        error,
      );
      throw error;
    }
  }

  async createTopic(): Promise<void> {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({
        topics: [
          {
            topic: this.topic,
            numPartitions: 3,
            replicationFactor: 1,
            configEntries: [
              {
                name: 'retention.ms',
                value: '86400000', // 24 hours
              },
            ],
          },
        ],
        validateOnly: false,
        timeout: 5000,
      });
      this.logger.log(`Topic '${this.topic}' created successfully`);
    } catch (error: any) {
      if (error.message?.includes('Topic with this name already exists')) {
        this.logger.log(`Topic '${this.topic}' already exists`);
      } else {
        this.logger.error(`Failed to create topic '${this.topic}'`, error);
      }
    } finally {
      await admin.disconnect();
    }
  }
}
