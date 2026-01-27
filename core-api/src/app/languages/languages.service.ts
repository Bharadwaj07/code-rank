import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageConfigEntity } from './entities/language-config.entity';
import { CreateLanguageConfigDto } from './dto/create-language-config.dto';
import { UpdateLanguageConfigDto } from './dto/update-language-config.dto';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageConfigEntity)
    private readonly languageConfigRepository: Repository<LanguageConfigEntity>,
  ) {}

  async create(createLanguageConfigDto: CreateLanguageConfigDto) {
    const languageConfig = this.languageConfigRepository.create(
      createLanguageConfigDto,
    );
    return await this.languageConfigRepository.save(languageConfig);
  }

  async findAll() {
    return await this.languageConfigRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(languageId: string) {
    return await this.languageConfigRepository.findOne({
      where: { languageId },
    });
  }

  async update(
    languageId: string,
    updateLanguageConfigDto: UpdateLanguageConfigDto,
  ) {
    await this.languageConfigRepository.update(
      languageId,
      updateLanguageConfigDto,
    );
    return await this.findOne(languageId);
  }

  async remove(languageId: string) {
    return await this.languageConfigRepository.delete(languageId);
  }
}
