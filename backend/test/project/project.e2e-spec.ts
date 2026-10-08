import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('Projects (e2e)', () => {
  let testSetup: TestSetup;
  let userSequence = 0;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  async function authenticate(name = 'Test User') {
    userSequence += 1;
    const user = {
      email: `project-test-${userSequence}@example.com`,
      password: 'Password123!',
      name,
    };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);

    return response.body.accessToken as string;
  }

  async function createClient(token: string, name?: string) {
    const clientName = name ?? `Project Client ${userSequence}-${Date.now()}`;
    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: clientName,
        phone: '11987654321',
        email: `${clientName.toLowerCase().replaceAll(' ', '.')}@example.com`,
        personType: 'INDIVIDUAL',
      })
      .expect(201);

    return response.body.id as string;
  }

  async function createProject(token: string, overrides = {}) {
    const clientId = await createClient(token);
    const payload = {
      clientId,
      title: 'New Project',
      local: 'New Location',
      date: '2023-01-01',
      notes: 'New Notes',
      agreed_price: 100.0,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return { id: response.body.id as string, payload, response };
  }

  it('cria project com dados válidos', async () => {
    const token = await authenticate();
    const { payload, response } = await createProject(token);

    expect(response.body).toMatchObject({
      ...payload,
      agreed_price: 100,
    });
    expect(response.body).toHaveProperty('id');
  });

  it('rejeita dados obrigatórios ausentes', async () => {
    const token = await authenticate();

    await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Incomplete Project' })
      .expect(400);
  });

  it('lista os projects do usuário autenticado', async () => {
    const token = await authenticate();
    const first = await createProject(token, { title: 'First Project' });
    const second = await createProject(token, { title: 'Second Project' });

    const response = await request(testSetup.app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.id, title: 'First Project' }),
        expect.objectContaining({ id: second.id, title: 'Second Project' }),
      ]),
    );
  });

  it('consulta project pelo ID', async () => {
    const token = await authenticate();
    const { id, payload } = await createProject(token);

    const response = await request(testSetup.app.getHttpServer())
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      ...payload,
      agreed_price: '100.00',
    });
  });

  it('retorna 404 para project inexistente', async () => {
    const token = await authenticate();

    await request(testSetup.app.getHttpServer())
      .get('/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('edita project e persiste a alteração', async () => {
    const token = await authenticate();
    const { id } = await createProject(token);

    await request(testSetup.app.getHttpServer())
      .patch(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Project', notes: 'Updated Notes' })
      .expect(200)
      .expect((response) => {
        expect(response.body.title).toBe('Updated Project');
        expect(response.body.notes).toBe('Updated Notes');
      });

    await request(testSetup.app.getHttpServer())
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.title).toBe('Updated Project');
        expect(response.body.notes).toBe('Updated Notes');
      });
  });

  it('remove project e retorna 404 na consulta posterior', async () => {
    const token = await authenticate();
    const { id } = await createProject(token);

    await request(testSetup.app.getHttpServer())
      .delete(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(testSetup.app.getHttpServer())
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejeita acesso sem autenticação', async () => {
    await request(testSetup.app.getHttpServer()).get('/projects').expect(401);
    await request(testSetup.app.getHttpServer()).post('/projects').expect(401);
  });

  it('isola projects entre usuários', async () => {
    const userAToken = await authenticate('User A');
    const { id } = await createProject(userAToken, { title: 'Project of A' });
    const userBToken = await authenticate('User B');

    await request(testSetup.app.getHttpServer())
      .get(`/projects/${id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);
  });
});
