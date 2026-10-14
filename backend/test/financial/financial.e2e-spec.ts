import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('Category (e2e)', () => {
  let testSetup: TestSetup;
  let authToken: string;
  let categoryId: string;

  const testUser = {
    email: 'tes5@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('accessToken');
    authToken = loginResponse.body.accessToken;

    const response = await request(testSetup.app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Category',
        icon: 'new-icon',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('New Category');
    expect(response.body.icon).toBe('new-icon');

    categoryId = response.body.id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });
});
