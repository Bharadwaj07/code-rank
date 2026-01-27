import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RateLimitTrackingEntity } from './entities/rate-limit-tracking.entity';

@Injectable()
export class RateLimitService {
  constructor(
    @InjectRepository(RateLimitTrackingEntity)
    private readonly rateLimitRepository: Repository<RateLimitTrackingEntity>,
  ) {}

  async checkAndIncrement(
    userId: string,
    limit: number,
    windowSizeMinutes: number = 60,
  ): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSizeMinutes * 60 * 1000);
    const windowEnd = new Date(now.getTime() + windowSizeMinutes * 60 * 1000);

    const tracking = await this.rateLimitRepository.findOne({
      where: {
        userId,
        windowEnd: Between(now, windowEnd),
      },
    });

    if (!tracking) {
      const newTracking = this.rateLimitRepository.create({
        userId,
        requestCount: 1,
        windowStart,
        windowEnd,
      });
      await this.rateLimitRepository.save(newTracking);
      return true;
    }

    if (tracking.requestCount >= limit) {
      return false;
    }

    tracking.requestCount += 1;
    await this.rateLimitRepository.save(tracking);
    return true;
  }

  async getRateLimitStatus(userId: string) {
    const now = new Date();
    const tracking = await this.rateLimitRepository.findOne({
      where: {
        userId,
        windowEnd: Between(now, new Date(now.getTime() + 60 * 60 * 1000)),
      },
    });

    return {
      requestCount: tracking?.requestCount || 0,
      windowStart: tracking?.windowStart,
      windowEnd: tracking?.windowEnd,
    };
  }
}
