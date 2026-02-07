import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { RateLimitService } from './rate-limit.service';
import { CodeSubmissionEntity } from './entities/code-submission.entity';
import { ExecutionResultEntity } from './entities/execution-result.entity';
import { RateLimitTrackingEntity } from './entities/rate-limit-tracking.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { LanguagesModule } from '../languages/languages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CodeSubmissionEntity,
      ExecutionResultEntity,
      RateLimitTrackingEntity,
    ]),
    KafkaModule,
    LanguagesModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, RateLimitService],
  exports: [SubmissionsService, RateLimitService],
})
export class SubmissionsModule {}
