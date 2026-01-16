import { registerAs } from '@nestjs/config';
import { DbConfig } from '../shared/types/db.type';

export default registerAs(
  'db',
  ():DbConfig => ({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: process.env.DB_SSL === 'true',
  }),
);
