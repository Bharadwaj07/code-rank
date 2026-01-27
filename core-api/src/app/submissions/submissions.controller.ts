import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Request() req: any, @Body() createSubmissionDto: CreateSubmissionDto) {
    const userId = req.user.id;
    return this.submissionsService.create(userId, createSubmissionDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user.id;
    return this.submissionsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }
}
