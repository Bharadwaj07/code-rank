import { Pool } from 'pg';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { ExecutionResult } from '../types/execution.types';

export class DatabaseService {
  private pool: Pool;
  private isConnected = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
      ssl: config.database.ssl,
      max: 10, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (error) => {
      logger.error('Database pool error:', error);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      logger.info('Connected to database successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Disconnected from database');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
  ): Promise<void> {
    try {
      const query = `
        UPDATE code_submissions 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `;
      await this.pool.query(query, [status, submissionId]);
      logger.debug(`Updated submission ${submissionId} status to ${status}`);
    } catch (error) {
      logger.error(`Failed to update submission ${submissionId} status:`, error);
      throw error;
    }
  }

  async saveExecutionResult(submissionId: string, result: ExecutionResult): Promise<void> {
    try {
      const query = `
        INSERT INTO execution_results 
        (submission_id, stdout, stderr, compilation_error, runtime_error, execution_time_ms, exit_code, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (submission_id) DO UPDATE SET
          stdout = EXCLUDED.stdout,
          stderr = EXCLUDED.stderr,
          compilation_error = EXCLUDED.compilation_error,
          runtime_error = EXCLUDED.runtime_error,
          execution_time_ms = EXCLUDED.execution_time_ms,
          exit_code = EXCLUDED.exit_code
      `;

      await this.pool.query(query, [
        submissionId,
        result.stdout || null,
        result.stderr || null,
        result.compilationError || null,
        result.runtimeError || null,
        result.executionTimeMs,
        result.exitCode,
      ]);

      logger.debug(`Saved execution result for submission ${submissionId}`);
    } catch (error) {
      logger.error(`Failed to save execution result for submission ${submissionId}:`, error);
      throw error;
    }
  }

  async updateExecutionTiming(
    submissionId: string,
    executionStartedAt: Date,
    executionCompletedAt: Date,
  ): Promise<void> {
    try {
      const query = `
        UPDATE code_submissions 
        SET 
          execution_started_at = $1,
          execution_completed_at = $2,
          updated_at = NOW()
        WHERE id = $3
      `;

      await this.pool.query(query, [executionStartedAt, executionCompletedAt, submissionId]);
      logger.debug(`Updated execution timing for submission ${submissionId}`);
    } catch (error) {
      logger.error(`Failed to update execution timing for submission ${submissionId}:`, error);
      throw error;
    }
  }

  async markSubmissionCompleted(submissionId: string, success: boolean): Promise<void> {
    try {
      const status = success ? 'completed' : 'failed';
      const query = `
        UPDATE code_submissions 
        SET 
          status = $1,
          execution_completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `;

      await this.pool.query(query, [status, submissionId]);
      logger.info(`Marked submission ${submissionId} as ${status}`);
    } catch (error) {
      logger.error(`Failed to mark submission ${submissionId} as completed:`, error);
      throw error;
    }
  }

  async getSubmission(submissionId: string): Promise<any> {
    try {
      const query = `SELECT * FROM code_submissions WHERE id = $1`;
      const result = await this.pool.query(query, [submissionId]);

      if (result.rows.length === 0) {
        logger.warn(`Submission ${submissionId} not found`);
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get submission ${submissionId}:`, error);
      throw error;
    }
  }

  isConnected_(): boolean {
    return this.isConnected;
  }
}
