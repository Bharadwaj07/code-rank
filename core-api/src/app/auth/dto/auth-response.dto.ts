export class AuthResponseDto {
  accessToken!: string;
  tokenType: string = 'Bearer';
  expiresIn!: number;
  userId?: string;
  email?: string;
}
