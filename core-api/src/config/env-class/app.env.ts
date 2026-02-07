import {  IsEnum } from 'class-validator';
import { Environment } from '../../shared/enums/environment.enum';
import { DataBaseEnvValidator } from './database.env';


export class AppEnv extends DataBaseEnvValidator {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;
}