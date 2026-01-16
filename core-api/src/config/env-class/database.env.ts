import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';


export class DataBaseEnvValidator {
  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  DB_PORT = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @Type(() => Boolean)
  @IsBoolean()
  DB_SSL = false;
}