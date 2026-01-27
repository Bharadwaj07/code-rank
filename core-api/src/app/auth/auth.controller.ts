import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    if (!registerDto.email || !registerDto.password || !registerDto.username) {
      throw new BadRequestException(
        'Email, password, and username are required',
      );
    }
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email and password are required');
    }
    return await this.authService.login(loginDto);
  }
}
