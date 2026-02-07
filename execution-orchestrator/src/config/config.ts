import 'dotenv/config';

export const config = {
  // Redis Configuration (COMMENTED OUT - using Kafka)
  // redis: {
  //   host: process.env.REDIS_HOST || 'localhost',
  //   port: parseInt(process.env.REDIS_PORT || '6379', 10),
  //   password: process.env.REDIS_PASSWORD,
  //   db: parseInt(process.env.REDIS_DB || '0', 10),
  // },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'execution-orchestrator',
    topic: process.env.KAFKA_TOPIC || 'code-execution-jobs',
    groupId: process.env.KAFKA_GROUP_ID || 'execution-group',
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000', 10),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '25000', 10),
    autoCommit: process.env.KAFKA_AUTO_COMMIT !== 'false',
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'coderank',
    ssl: process.env.DB_SSL === 'true',
  },

  // Queue Configuration
  queue: {
    name: 'code-execution',
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    pollInterval: parseInt(process.env.QUEUE_POLL_INTERVAL || '5000', 10),
  },

  // Execution Configuration
  execution: {
    tempDir: process.env.TEMP_DIR || '/tmp',
    maxExecutionTimeMs: parseInt(process.env.MAX_EXECUTION_TIME || '30000', 10),
    maxMemoryMb: parseInt(process.env.MAX_MEMORY_MB || '512', 10),
  },

  // Docker Configuration
  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    removeContainerAfterExecution: process.env.DOCKER_REMOVE_CONTAINER !== 'false',
  },

  // Application Configuration
  app: {
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    workerName: process.env.WORKER_NAME || `worker-${process.pid}`,
  },
};
