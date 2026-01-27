import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    try {
      await this.usersService.findByEmail(registerDto.email);
    } catch (error) {
      if (error instanceof ConflictException) {
       throw new ConflictException(error);
      }
      // User doesn't exist, continue
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      userName: registerDto.username,
      email: registerDto.email,
      passwordHash: hashedPassword,
    });

    return {
      userId: user.id,
      username: user.userName,
      email: user.email,
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.userName,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 3600; // 1 hour

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      userId: user.id,
      email: user.email,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
