import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { CreateLanguageConfigDto } from './dto/create-language-config.dto';
import { UpdateLanguageConfigDto } from './dto/update-language-config.dto';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  create(@Body() createLanguageConfigDto: CreateLanguageConfigDto) {
    return this.languagesService.create(createLanguageConfigDto);
  }

  @Get()
  findAll() {
    return this.languagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.languagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLanguageConfigDto: UpdateLanguageConfigDto,
  ) {
    return this.languagesService.update(id, updateLanguageConfigDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.languagesService.remove(id);
  }
}
