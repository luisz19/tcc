import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('Clients (e2e)', () => {
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
      email: `client-test-${userSequence}@example.com`,
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

  async function createClient(token: string, overrides = {}) {
    const payload = {
      name: 'Client Test',
      phone: '11987654321',
      email: 'client@example.com',
      address: '123 Test Street',
      personType: 'INDIVIDUAL',
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return { id: response.body.id as string, payload, response };
  }

  it('cria cliente PF', async () => {
    const token = await authenticate();
    const { payload, response } = await createClient(token);

    expect(response.body).toMatchObject(payload);
    expect(response.body).toHaveProperty('id');
  });

  it('cria cliente PJ e persiste personType', async () => {
    const token = await authenticate();
    const { id, payload } = await createClient(token, {
      name: 'Empresa Teste',
      email: 'empresa@example.com',
      personType: 'BUSINESS',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject(payload);
  });

  it('rejeita dados obrigatórios ausentes', async () => {
    const token = await authenticate();

    await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'incompleto@example.com' })
      .expect(400);
  });

  it('lista clientes do usuário autenticado', async () => {
    const token = await authenticate();
    const first = await createClient(token, { name: 'Primeiro Cliente' });
    const second = await createClient(token, {
      name: 'Segundo Cliente',
      email: 'segundo@example.com',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.id, name: first.payload.name }),
        expect.objectContaining({ id: second.id, name: second.payload.name }),
      ]),
    );
  });

  it('consulta cliente pelo ID', async () => {
    const token = await authenticate();
    const { id, payload } = await createClient(token);

    const response = await request(testSetup.app.getHttpServer())
      .get(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject(payload);
  });

  it('retorna 404 para cliente inexistente', async () => {
    const token = await authenticate();

    await request(testSetup.app.getHttpServer())
      .get('/clients/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('edita cliente', async () => {
    const token = await authenticate();
    const { id } = await createClient(token);

    await request(testSetup.app.getHttpServer())
      .patch(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Atualizado', phone: '11999999999' })
      .expect(200)
      .expect((response) => {
        expect(response.body.name).toBe('Cliente Atualizado');
        expect(response.body.phone).toBe('11999999999');
      });

    await request(testSetup.app.getHttpServer())
      .get(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.name).toBe('Cliente Atualizado');
        expect(response.body.phone).toBe('11999999999');
      });
  });

  it('remove cliente e não permite consulta posterior', async () => {
    const token = await authenticate();
    const { id } = await createClient(token);

    await request(testSetup.app.getHttpServer())
      .delete(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(testSetup.app.getHttpServer())
      .get(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejeita acesso sem autenticação', async () => {
    await request(testSetup.app.getHttpServer()).get('/clients').expect(401);
    await request(testSetup.app.getHttpServer()).post('/clients').expect(401);
  });

  it('isola clientes entre usuários', async () => {
    const userAToken = await authenticate('User A');
    const { id } = await createClient(userAToken, { name: 'Cliente do A' });
    const userBToken = await authenticate('User B');

    await request(testSetup.app.getHttpServer())
      .get(`/clients/${id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);
  });

  it('pesquisa clientes por nome', async () => {
    const token = await authenticate();
    const match = await createClient(token, { name: 'Ana Souza' });
    await createClient(token, {
      name: 'Bruno Lima',
      email: 'bruno@example.com',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get('/clients')
      .query({ name: 'Ana' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: match.id, name: 'Ana Souza' });
  });

  it('pesquisa clientes por telefone', async () => {
    const token = await authenticate();
    const match = await createClient(token, { phone: '11911112222' });
    await createClient(token, {
      name: 'Outro Cliente',
      phone: '21933334444',
      email: 'outro@example.com',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get('/clients')
      .query({ phone: '91111' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: match.id,
      phone: '11911112222',
    });
  });
});
