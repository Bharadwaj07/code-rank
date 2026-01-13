import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from './users/users.module';


@Module({
  imports: [ConfigModule.forRoot(), 
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: 'coderank',
      password: 'coderank',
      database: 'coderank',
      autoLoadEntities: true,
      synchronize: false, // VERY IMPORTANT
    }), UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
