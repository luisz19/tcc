import Joi from 'joi';
import { AppConfig } from './app.config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface ConfigType {
  app: AppConfig;
  database: TypeOrmModuleOptions; // esse é o tipo do TypeOrmModuleOptions, que foi usado para configurar o TypeORM no arquivo database.config.ts
  auth: AppConfig;
}

export const appConfigSchema = Joi.object({
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(8080),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNC: Joi.number().valid(1, 2).required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
});
