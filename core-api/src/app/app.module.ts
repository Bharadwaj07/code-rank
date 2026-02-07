import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LanguagesModule } from './languages/languages.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { validateClass } from '../shared/utils/validator.util';
import { AppEnv } from '../config/env-class/app.env';
import dbConfig from '../config/db.config';
import { DbConfig } from '../shared/types/db.type';
import { KafkaModule } from './kafka/kafka.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: config => validateClass(AppEnv, config),
      load: [dbConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get<DbConfig>('db');
        if (!db) {
          throw new Error('Database configuration is not defined');
        }
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          ssl: db.ssl,
          synchronize: process.env.NODE_ENV !== 'production',
          autoLoadEntities: true,
        };
      },
    }),
    KafkaModule,
    UsersModule,
    AuthModule,
    LanguagesModule,
    SubmissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
