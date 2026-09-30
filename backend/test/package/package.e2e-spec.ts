import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('Package (e2e)', () => {
  let testSetup: TestSetup;
  let authToken: string;
  let packageId: string;

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
      .post('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Package',
        description: 'This is a new package',
        base_price: 100,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('New Package');
    expect(response.body.description).toBe('This is a new package');
    expect(response.body.base_price).toBe(100);

    packageId = response.body.id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  it('/packages (GET)', async () => {
    const response = await request(testSetup.app.getHttpServer())
      .get('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('/packages/:id (GET)', async () => {
    const response = await request(testSetup.app.getHttpServer())
      .get(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', packageId);
  });

  it('/packages (POST) duplicate', async () => {
    return await request(testSetup.app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Package',
        description: 'This is a duplicate package',
        base_price: 100,
      })
      .expect(409);
  });

  it('/packages/:id (PATCH)', async () => {
    const response = await request(testSetup.app.getHttpServer())
      .patch(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Package',
        description: 'This is an updated package',
        base_price: 150,
      })
      .expect(200);

    expect(response.body).toHaveProperty('id', packageId);
    expect(response.body.name).toBe('Updated Package');
    expect(response.body.description).toBe('This is an updated package');
    expect(response.body.base_price).toBe(150);
  });

  it('/packages/:id (DELETE)', async () => {
    await request(testSetup.app.getHttpServer())
      .delete(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);
  });
});
