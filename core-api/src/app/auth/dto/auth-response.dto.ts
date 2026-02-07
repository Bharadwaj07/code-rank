export class AuthResponseDto {
  accessToken!: string;
  tokenType: string;
  expiresIn!: number;
  userId?: string;
  email?: string;
  username?: string;

  constructor() {
    this.tokenType = 'Bearer';
  }
}
