import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('Package (e2e)', () => {
  let testSetup: TestSetup;
  let userSequence = 0;
  let packageSequence = 0;
  let projectSequence = 0;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  async function authenticate(name = 'Package Test User'): Promise<string> {
    userSequence += 1;
    const user = {
      email: `package-test-${userSequence}@example.com`,
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

  async function createPackage(
    token: string,
    overrides: Record<string, any> = {},
  ) {
    packageSequence += 1;
    const payload = {
      name: `Pacote Teste ${Date.now()}-${packageSequence}`,
      description: 'Descrição detalhada do pacote',
      base_price: 250.0,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    return { response, payload, id: response.body?.id as string };
  }

  async function createClient(
    token: string,
    name = `Client ${Date.now()}-${userSequence}`,
  ): Promise<string> {
    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        phone: '11987654321',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: 'Rua das Flores, 123',
        personType: 'individual',
      })
      .expect(201);

    return response.body.id as string;
  }

  async function createProject(
    token: string,
    overrides: Record<string, any> = {},
  ) {
    projectSequence += 1;
    const clientId = overrides.clientId ?? (await createClient(token));

    const day = 10 + (projectSequence % 18);
    const startHour = 8 + (projectSequence % 10);
    const defaultStartAt = `2026-11-${String(day).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:00:00.000Z`;
    const defaultEndAt = `2026-11-${String(day).padStart(2, '0')}T${String(startHour + 1).padStart(2, '0')}:00:00.000Z`;

    const payload = {
      clientId,
      title: overrides.title ?? `Projeto ${Date.now()}-${projectSequence}`,
      startAt: defaultStartAt,
      endAt: defaultEndAt,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return { id: response.body.id as string, payload, response };
  }

  describe('Cadastro de pacote', () => {
    it('cadastra um pacote com dados válidos e persiste corretamente', async () => {
      const token = await authenticate();

      const packagePayload = {
        name: 'Pacote Fotografia Premium',
        description: 'Ensaio fotográfico externo completo com álbum',
        base_price: 500.5,
      };

      const response = await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send(packagePayload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(packagePayload.name);
      expect(response.body.description).toBe(packagePayload.description);
      expect(Number(response.body.base_price)).toBe(500.5);
      expect(response.body).toHaveProperty('userId');

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/packages/${response.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.id).toBe(response.body.id);
      expect(getResponse.body.name).toBe(packagePayload.name);
      expect(Number(getResponse.body.base_price)).toBe(500.5);
    });

    it('rejeita cadastro de pacote com nome duplicado para o mesmo usuário com 409 Conflict', async () => {
      const token = await authenticate();
      const packageName = 'Pacote Duplicado Teste';

      await createPackage(token, { name: packageName });

      const duplicateResponse = await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: packageName,
          description: 'Segunda tentativa',
          base_price: 300.0,
        })
        .expect(409);

      expect(duplicateResponse.body.message).toBe(
        'Package with the same name already exists for this user.',
      );
    });

    it('permite que usuários diferentes cadastrem pacotes com o mesmo nome', async () => {
      const user1Token = await authenticate('User 1');
      const user2Token = await authenticate('User 2');
      const sharedName = 'Pacote Básico';

      await createPackage(user1Token, { name: sharedName });

      const user2Response = await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: sharedName,
          description: 'Pacote do User 2',
          base_price: 200.0,
        })
        .expect(201);

      expect(user2Response.body.name).toBe(sharedName);
    });
  });

  it('Listagem de pacotes e isolamento entre usuários', async () => {
    const user1Token = await authenticate('User 1');
    const { id: pkg1Id } = await createPackage(user1Token, {
      name: 'Pacote 1 User 1',
    });
    const { id: pkg2Id } = await createPackage(user1Token, {
      name: 'Pacote 2 User 1',
    });

    const user2Token = await authenticate('User 2');
    const { id: pkgUser2Id } = await createPackage(user2Token, {
      name: 'Pacote User 2',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get('/packages')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);

    const ids = response.body.map((item: any) => item.id);
    expect(ids).toContain(pkg1Id);
    expect(ids).toContain(pkg2Id);
    expect(ids).not.toContain(pkgUser2Id);
  });

  it('Consulta de pacote por ID', async () => {
    const token = await authenticate();
    const { id: packageId, payload } = await createPackage(token, {
      name: 'Pacote Consulta ID',
      description: 'Descrição específica para busca',
      base_price: 320.0,
    });

    const response = await request(testSetup.app.getHttpServer())
      .get(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.id).toBe(packageId);
    expect(response.body.name).toBe(payload.name);
    expect(response.body.description).toBe(payload.description);
    expect(Number(response.body.base_price)).toBe(payload.base_price);
  });

  describe('Atualização de pacote via PATCH', () => {
    it('atualiza parcialmente campos do pacote mantendo os não enviados inalterados', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token, {
        name: 'Nome Original',
        description: 'Descrição Original',
        base_price: 200.0,
      });

      const patchResponse = await request(testSetup.app.getHttpServer())
        .patch(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ base_price: 350.75 })
        .expect(200);

      expect(patchResponse.body.id).toBe(packageId);
      expect(Number(patchResponse.body.base_price)).toBe(350.75);
      expect(patchResponse.body.name).toBe('Nome Original');
      expect(patchResponse.body.description).toBe('Descrição Original');

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Number(getResponse.body.base_price)).toBe(350.75);
      expect(getResponse.body.name).toBe('Nome Original');
    });

    it('rejeita atualização para nome já existente em outro pacote do mesmo usuário', async () => {
      const token = await authenticate();
      await createPackage(token, { name: 'Pacote A' });
      const { id: pkgBId } = await createPackage(token, { name: 'Pacote B' });

      const response = await request(testSetup.app.getHttpServer())
        .patch(`/packages/${pkgBId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote A' })
        .expect(409);

      expect(response.body.message).toBe(
        'Package with the same name already exists for this user.',
      );
    });
  });

  describe('Exclusão de pacote e verificação de remoção nas consultas', () => {
    it('Exclusão de pacote e verificação de remoção nas consultas', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token);

      await request(testSetup.app.getHttpServer())
        .delete(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(testSetup.app.getHttpServer())
        .get(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      const listResponse = await request(testSetup.app.getHttpServer())
        .get('/packages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const ids = listResponse.body.map((item: any) => item.id);
      expect(ids).not.toContain(packageId);
    });
  });

  it('Cadastro de pacote sem associar a um projeto (operação independente)', async () => {
    const token = await authenticate();

    const response = await request(testSetup.app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pacote Independente Sem Projeto',
        description: 'Pacote no catálogo aguardando associação futura',
        base_price: 400.0,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Pacote Independente Sem Projeto');

    const getResponse = await request(testSetup.app.getHttpServer())
      .get(`/packages/${response.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.id).toBe(response.body.id);
  });

  describe('Associação a projeto e verificação do relacionamento', () => {
    it('associa pacote a projeto existente e impede exclusão sem confirmação (PACKAGE_IN_USE)', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token, {
        name: 'Pacote Vinculado',
        base_price: 600.0,
      });

      const { id: projectId } = await createProject(token, {
        packageId,
        title: 'Projeto com Pacote Vinculado',
      });

      const projectGet = await request(testSetup.app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(projectGet.body.packageId).toBe(packageId);

      const deleteInUse = await request(testSetup.app.getHttpServer())
        .delete(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(deleteInUse.body).toMatchObject({
        code: 'PACKAGE_IN_USE',
        projectCount: 1,
      });
    });

    it('permite exclusão com confirm=true desvinculando os projetos associados sem excluí-los', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token);

      const { id: projectId } = await createProject(token, {
        packageId,
        title: 'Projeto Desvinculação Segura',
      });

      await request(testSetup.app.getHttpServer())
        .delete(`/packages/${packageId}`)
        .query({ confirm: 'true' })
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(testSetup.app.getHttpServer())
        .get(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      const projectAfter = await request(testSetup.app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(projectAfter.body.id).toBe(projectId);
      expect(projectAfter.body.packageId).toBeNull();
    });
  });

  it('Tentar associar pacote a um projeto inexistente rejeita a operação com 404', async () => {
    const token = await authenticate();
    const { id: packageId } = await createPackage(token);
    const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

    await request(testSetup.app.getHttpServer())
      .patch(`/projects/${nonExistentProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId })
      .expect(404);
  });

  describe('Consulta de pacote inexistente', () => {
    it('retorna 404 quando o UUID do pacote não existe', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .get(`/packages/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('retorna 400 quando o ID não é um UUID válido', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .get('/packages/id-invalido-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Campos obrigatórios e validações de preço', () => {
    it('rejeita payload vazio com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('rejeita ausência do campo name com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ base_price: 150.0 })
        .expect(400);
    });

    it('rejeita ausência do campo base_price com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote Sem Preço' })
        .expect(400);
    });

    it('rejeita base_price negativo no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote Negativo', base_price: -100.0 })
        .expect(400);
    });

    it('rejeita base_price zero no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote Zero', base_price: 0 })
        .expect(400);
    });

    it('rejeita base_price com mais de duas casas decimais no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote Fracionado', base_price: 100.555 })
        .expect(400);
    });

    it('rejeita base_price não numérico com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pacote Valor Texto', base_price: 'cem' })
        .expect(400);
    });

    it('rejeita atualização via PATCH com base_price negativo', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token);

      await request(testSetup.app.getHttpServer())
        .patch(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ base_price: -50.0 })
        .expect(400);
    });

    it('rejeita atualização via PATCH com base_price com mais de 2 casas decimais', async () => {
      const token = await authenticate();
      const { id: packageId } = await createPackage(token);

      await request(testSetup.app.getHttpServer())
        .patch(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ base_price: 99.999 })
        .expect(400);
    });
  });

  it('Atualizar um pacote associado a um projeto preserva a integridade do relacionamento', async () => {
    const token = await authenticate();
    const { id: packageId } = await createPackage(token, {
      name: 'Pacote Original',
      description: 'Descrição Original',
      base_price: 300.0,
    });

    const { id: projectId } = await createProject(token, {
      packageId,
      title: 'Projeto Teste Integridade',
    });

    const updateResponse = await request(testSetup.app.getHttpServer())
      .patch(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pacote Atualizado com Sucesso',
        description: 'Nova descrição do pacote',
        base_price: 450.0,
      })
      .expect(200);

    expect(updateResponse.body.name).toBe('Pacote Atualizado com Sucesso');
    expect(Number(updateResponse.body.base_price)).toBe(450.0);

    const projectResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(projectResponse.body.packageId).toBe(packageId);

    const packageResponse = await request(testSetup.app.getHttpServer())
      .get(`/packages/${packageId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(packageResponse.body.name).toBe('Pacote Atualizado com Sucesso');
    expect(packageResponse.body.description).toBe('Nova descrição do pacote');
    expect(Number(packageResponse.body.base_price)).toBe(450.0);
  });
});
