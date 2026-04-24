import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

import { type AppEnv } from '../config/env.schema';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<AppEnv, true>) => {
        const url = config.get('REDIS_URL', { infer: true });
        return {
          connection: new IORedis(url, {
            maxRetriesPerRequest: null,
            lazyConnect: true,
            retryStrategy: (times) => (times < 3 ? times * 200 : null),
          }),
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'default' }),
  ],
  exports: [BullModule],
})
export class JobsModule {}
