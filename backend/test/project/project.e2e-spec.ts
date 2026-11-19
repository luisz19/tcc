import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';
import {
  ProjectStatus,
  ProjectType,
} from '../../src/project/model/project.model';

describe('Projects (e2e)', () => {
  let testSetup: TestSetup;
  let userSequence = 0;
  let projectSequence = 0;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  async function authenticate(name = 'Test User'): Promise<string> {
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

  async function createClient(
    token: string,
    name?: string,
  ): Promise<{ id: string; name: string }> {
    const clientName = name ?? `Project Client ${userSequence}-${Date.now()}`;
    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: clientName,
        phone: '11987654321',
        email: `${clientName.toLowerCase().replaceAll(' ', '.')}@example.com`,
        address: '123 Test Street',
        personType: 'individual',
      })
      .expect(201);

    return { id: response.body.id as string, name: clientName };
  }

  async function createPackage(
    token: string,
    overrides: Record<string, any> = {},
  ): Promise<{ id: string; name: string; base_price: number }> {
    const payload = {
      name: `Test Package ${userSequence}-${Date.now()}`,
      description: 'Test Description',
      base_price: 200.0,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return {
      id: response.body.id as string,
      name: payload.name,
      base_price: payload.base_price,
    };
  }

  async function createProject(
    token: string,
    overrides: Record<string, any> = {},
  ) {
    projectSequence += 1;
    const client =
      overrides.clientId != null
        ? { id: overrides.clientId, name: 'Client' }
        : await createClient(token);

    const day = 10 + (projectSequence % 18);
    const startHour = 8 + (projectSequence % 10);
    const defaultStartAt = `2026-11-${String(day).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:00:00.000Z`;
    const defaultEndAt = `2026-11-${String(day).padStart(2, '0')}T${String(startHour + 1).padStart(2, '0')}:00:00.000Z`;

    const payload = {
      clientId: client.id,
      title: `Project ${Date.now()}-${projectSequence}`,
      local: 'Estúdio Central',
      startAt: defaultStartAt,
      endAt: defaultEndAt,
      notes: 'Notas de teste do projeto',
      agreed_price: 150.0,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return { id: response.body.id as string, payload, response };
  }

  it('Cadastro de projeto com dados válidos e persistência', async () => {
    const token = await authenticate();
    const client = await createClient(token);

    const projectPayload = {
      clientId: client.id,
      title: 'Ensaio Fotográfico de Casamento',
      local: 'Igreja Matriz',
      status: ProjectStatus.CONFIRMED,
      startAt: '2026-12-05T14:00:00.000Z',
      endAt: '2026-12-05T18:00:00.000Z',
      notes: 'Cobertura completa da cerimônia e festa',
      agreed_price: 2500.0,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(projectPayload.title);
    expect(response.body.clientId).toBe(client.id);
    expect(response.body.local).toBe(projectPayload.local);
    expect(response.body.projectType).toBe(ProjectType.PHOTO_SESSION);
    expect(response.body.status).toBe(projectPayload.status);
    expect(Number(response.body.agreed_price)).toBe(2500.0);
    expect(response.body.notes).toBe(projectPayload.notes);
    expect(response.body).toHaveProperty('userId');

    const getResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${response.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.id).toBe(response.body.id);
    expect(getResponse.body.title).toBe(projectPayload.title);
    expect(getResponse.body.clientId).toBe(client.id);
    expect(Number(getResponse.body.agreed_price)).toBe(2500.0);
  });

  it('Vinculação a cliente existente', async () => {
    const token = await authenticate();
    const client = await createClient(token, 'Maria Silva Noiva');

    const { id: projectId, payload } = await createProject(token, {
      clientId: client.id,
      title: 'Projeto da Maria Silva',
    });

    expect(payload.clientId).toBe(client.id);

    const response = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.clientId).toBe(client.id);
  });

  describe('Vinculação a pacote existente', () => {
    it('associa pacote ao projeto e herda base_price quando agreed_price é omitido', async () => {
      const token = await authenticate();
      const client = await createClient(token);
      const pkg = await createPackage(token, {
        name: 'Pacote Formatura Luxo',
        base_price: 750.0,
      });

      const response = await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          packageId: pkg.id,
          title: 'Formatura Medicina 2026',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.packageId).toBe(pkg.id);
      expect(Number(response.body.agreed_price)).toBe(750.0);

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/projects/${response.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.packageId).toBe(pkg.id);
      expect(Number(getResponse.body.agreed_price)).toBe(750.0);
    });

    it('associa pacote mantendo agreed_price quando especificado explicitamente', async () => {
      const token = await authenticate();
      const client = await createClient(token);
      const pkg = await createPackage(token, {
        name: 'Pacote Básico',
        base_price: 300.0,
      });

      const response = await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          packageId: pkg.id,
          title: 'Sessão com Desconto',
          agreed_price: 250.0,
        })
        .expect(201);

      expect(response.body.packageId).toBe(pkg.id);
      expect(Number(response.body.agreed_price)).toBe(250.0);
    });
  });

  it('Cadastro de projeto sem associar pacote (opcional)', async () => {
    const token = await authenticate();
    const client = await createClient(token);

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.id,
        title: 'Projeto Avulso Sem Pacote',
        agreed_price: 500.0,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.packageId).toBeNull();
    expect(Number(response.body.agreed_price)).toBe(500.0);

    const getResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${response.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.packageId).toBeNull();
  });

  it('Listagem de projetos cadastrados e isolamento entre usuários', async () => {
    const user1Token = await authenticate('User 1');
    const firstProject = await createProject(user1Token, {
      title: 'Projeto Alfa User 1',
    });
    const secondProject = await createProject(user1Token, {
      title: 'Projeto Beta User 1',
    });

    const user2Token = await authenticate('User 2');
    const user2Project = await createProject(user2Token, {
      title: 'Projeto de Outro Usuário',
    });

    const response = await request(testSetup.app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);

    const ids = response.body.map((item: any) => item.id);
    expect(ids).toContain(firstProject.id);
    expect(ids).toContain(secondProject.id);
    expect(ids).not.toContain(user2Project.id);
  });

  it('Consulta de projeto por ID com informações e vínculos com cliente e pacote', async () => {
    const token = await authenticate();
    const client = await createClient(token);
    const pkg = await createPackage(token);

    const { id: projectId } = await createProject(token, {
      clientId: client.id,
      packageId: pkg.id,
      title: 'Projeto Consulta Detalhada',
      local: 'Parque da Cidade',
      notes: 'Sessão ao pôr do sol',
      agreed_price: 450.0,
      status: ProjectStatus.CONFIRMED,
    });

    const response = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.id).toBe(projectId);
    expect(response.body.title).toBe('Projeto Consulta Detalhada');
    expect(response.body.local).toBe('Parque da Cidade');
    expect(response.body.notes).toBe('Sessão ao pôr do sol');
    expect(response.body.status).toBe(ProjectStatus.CONFIRMED);
    expect(Number(response.body.agreed_price)).toBe(450.0);
    expect(response.body.clientId).toBe(client.id);
    expect(response.body.packageId).toBe(pkg.id);
  });

  it('Atualização parcial de projeto via PATCH mantendo campos não enviados', async () => {
    const token = await authenticate();
    const client = await createClient(token);
    const pkg = await createPackage(token);

    const { id: projectId } = await createProject(token, {
      clientId: client.id,
      packageId: pkg.id,
      title: 'Título Original do Projeto',
      local: 'Estúdio 1',
      notes: 'Notas Originais',
      agreed_price: 350.0,
      status: ProjectStatus.PENDING,
    });

    const patchPayload = {
      title: 'Título Modificado via PATCH',
      notes: 'Notas Atualizadas com Novas Demandas',
    };

    const patchResponse = await request(testSetup.app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(patchPayload)
      .expect(200);

    expect(patchResponse.body.title).toBe(patchPayload.title);
    expect(patchResponse.body.notes).toBe(patchPayload.notes);
    expect(patchResponse.body.local).toBe('Estúdio 1');
    expect(patchResponse.body.clientId).toBe(client.id);
    expect(patchResponse.body.packageId).toBe(pkg.id);
    expect(patchResponse.body.status).toBe(ProjectStatus.PENDING);
    expect(Number(patchResponse.body.agreed_price)).toBe(350.0);

    const getResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.title).toBe(patchPayload.title);
    expect(getResponse.body.notes).toBe(patchPayload.notes);
    expect(getResponse.body.clientId).toBe(client.id);
    expect(getResponse.body.packageId).toBe(pkg.id);
  });

  it('Atualização de situação do projeto e persistência', async () => {
    const token = await authenticate();
    const { id: projectId } = await createProject(token, {
      status: ProjectStatus.PENDING,
    });

    const inProgressResponse = await request(testSetup.app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: ProjectStatus.IN_PROGRESS })
      .expect(200);

    expect(inProgressResponse.body.status).toBe(ProjectStatus.IN_PROGRESS);

    let getResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.status).toBe(ProjectStatus.IN_PROGRESS);

    const completedResponse = await request(testSetup.app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: ProjectStatus.COMPLETED })
      .expect(200);

    expect(completedResponse.body.status).toBe(ProjectStatus.COMPLETED);

    getResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.status).toBe(ProjectStatus.COMPLETED);
  });

  it('Exclusão de projeto e verificação de remoção nas consultas', async () => {
    const token = await authenticate();
    const { id: projectId } = await createProject(token);

    await request(testSetup.app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(testSetup.app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const listResponse = await request(testSetup.app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids = listResponse.body.map((item: any) => item.id);
    expect(ids).not.toContain(projectId);
  });

  describe('Tentativa de associar pacote inexistente', () => {
    it('retorna 404 ao cadastrar projeto com pacote inexistente', async () => {
      const token = await authenticate();
      const client = await createClient(token);
      const nonExistentPackageId = '00000000-0000-0000-0000-000000000000';

      const response = await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          packageId: nonExistentPackageId,
          title: 'Projeto com Pacote Inexistente',
        })
        .expect(404);

      expect(response.body.message).toBe('Package not found.');
    });

    it('retorna 404 ao cadastrar projeto com pacote pertencente a outro usuário', async () => {
      const user1Token = await authenticate('User 1');
      const user2Token = await authenticate('User 2');

      const user1Client = await createClient(user1Token);
      const user2Package = await createPackage(user2Token);

      const response = await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          clientId: user1Client.id,
          packageId: user2Package.id,
          title: 'Tentativa de Usar Pacote Alheio',
        })
        .expect(404);

      expect(response.body.message).toBe('Package not found.');
    });

    it('retorna 404 ao atualizar via PATCH com pacote inexistente', async () => {
      const token = await authenticate();
      const { id: projectId } = await createProject(token);
      const nonExistentPackageId = '00000000-0000-0000-0000-000000000000';

      const response = await request(testSetup.app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: nonExistentPackageId })
        .expect(404);

      expect(response.body.message).toBe('Package not found.');
    });
  });

  describe('Validação de campos obrigatórios e intervalos', () => {
    it('rejeita requisição vazia', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('rejeita ausência do campo title', async () => {
      const token = await authenticate();
      const client = await createClient(token);

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ clientId: client.id })
        .expect(400);
    });

    it('rejeita ausência do campo clientId', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Projeto Sem Cliente' })
        .expect(400);
    });

    it('rejeita quando apenas startAt é informado sem endAt', async () => {
      const token = await authenticate();
      const client = await createClient(token);

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          title: 'Projeto com Start Sem End',
          startAt: '2026-11-20T10:00:00.000Z',
        })
        .expect(400);
    });

    it('rejeita quando startAt ocorre após endAt', async () => {
      const token = await authenticate();
      const client = await createClient(token);

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          title: 'Intervalo Invertido',
          startAt: '2026-11-20T12:00:00.000Z',
          endAt: '2026-11-20T10:00:00.000Z',
        })
        .expect(400);
    });
  });

  describe('Integridade das relações com cliente e pacote após atualização', () => {
    it('mantém relações com cliente e pacote intactas após atualização parcial de outros campos', async () => {
      const token = await authenticate();
      const client = await createClient(token);
      const pkg = await createPackage(token);

      const { id: projectId } = await createProject(token, {
        clientId: client.id,
        packageId: pkg.id,
        title: 'Projeto Original Integridade',
        local: 'Local Antigo',
      });

      await request(testSetup.app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Projeto Atualizado Integridade',
          local: 'Novo Local',
        })
        .expect(200);

      const response = await request(testSetup.app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.clientId).toBe(client.id);
      expect(response.body.packageId).toBe(pkg.id);
      expect(response.body.title).toBe('Projeto Atualizado Integridade');
      expect(response.body.local).toBe('Novo Local');
    });

    it('permite atualizar a associação de pacote mantendo a vinculação do cliente intacta', async () => {
      const token = await authenticate();
      const client = await createClient(token);
      const pkgA = await createPackage(token, { name: 'Pacote A' });
      const pkgB = await createPackage(token, { name: 'Pacote B' });

      const { id: projectId } = await createProject(token, {
        clientId: client.id,
        packageId: pkgA.id,
        title: 'Projeto Troca de Pacote',
      });

      const patchResponse = await request(testSetup.app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: pkgB.id })
        .expect(200);

      expect(patchResponse.body.packageId).toBe(pkgB.id);
      expect(patchResponse.body.clientId).toBe(client.id);

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.packageId).toBe(pkgB.id);
      expect(getResponse.body.clientId).toBe(client.id);
    });
  });

  describe('Autenticação obrigatória nos endpoints de projetos', () => {
    it('rejeita GET /projects sem token com 401', async () => {
      await request(testSetup.app.getHttpServer()).get('/projects').expect(401);
    });

    it('rejeita GET /projects/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .get('/projects/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('rejeita POST /projects sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .send({ title: 'Projeto Não Autorizado' })
        .expect(401);
    });

    it('rejeita PATCH /projects/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .patch('/projects/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Alteração Não Autorizada' })
        .expect(401);
    });

    it('rejeita DELETE /projects/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .delete('/projects/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('rejeita requisições com token inválido com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer token_invalido_123')
        .expect(401);
    });
  });

  describe('Regras de agendamento de horários', () => {
    it('retorna 409 quando os horários de projetos do mesmo usuário se sobrepõem', async () => {
      const token = await authenticate();
      const client = await createClient(token);

      await createProject(token, {
        clientId: client.id,
        title: 'Projeto Original',
        startAt: '2026-11-25T10:00:00.000Z',
        endAt: '2026-11-25T12:00:00.000Z',
      });

      const response = await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          title: 'Projeto Sobreposto',
          startAt: '2026-11-25T11:00:00.000Z',
          endAt: '2026-11-25T13:00:00.000Z',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        code: 'PROJECT_SCHEDULE_CONFLICT',
        conflict: { title: 'Projeto Original' },
      });
    });

    it('permite projetos em horários imediatamente consecutivos', async () => {
      const token = await authenticate();
      const client = await createClient(token);

      await createProject(token, {
        clientId: client.id,
        title: 'Primeiro Bloco',
        startAt: '2026-11-25T10:00:00.000Z',
        endAt: '2026-11-25T12:00:00.000Z',
      });

      await request(testSetup.app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: client.id,
          title: 'Segundo Bloco Consecutivo',
          startAt: '2026-11-25T12:00:00.000Z',
          endAt: '2026-11-25T14:00:00.000Z',
        })
        .expect(201);
    });
  });
});
