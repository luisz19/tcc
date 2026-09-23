export const testConfig = {
  database: {
    type: 'postgres',
    host: 'localhost',
    port: 8080,
    username: 'postgres',
    password: 'postgres',
    database: 'tcc_e2e',
    synchronize: true, //recomendável apenas para dev individuais
  },
  app: {
    messagePrefix: '',
  },
  auth: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '1m',
    },
  },
};
