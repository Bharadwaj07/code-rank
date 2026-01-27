import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguagesService } from './languages.service';
import { LanguagesController } from './languages.controller';
import { LanguageConfigEntity } from './entities/language-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LanguageConfigEntity])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
