import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: number;
  };
}

export const authConfig = registerAs('auth', (): AuthConfig => ({
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string, 10),
  },
}));
