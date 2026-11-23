import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';
import { PersonType } from '../../src/clients/model/clients.model';

describe('Clients (e2e)', () => {
  let testSetup: TestSetup;
  let userSequence = 0;
  let clientSequence = 0;
  let projectSequence = 0;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  async function authenticate(name = 'Client Test User'): Promise<string> {
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

  async function createClient(
    token: string,
    overrides: Record<string, any> = {},
  ) {
    clientSequence += 1;
    const payload = {
      name: `Cliente Teste ${Date.now()}-${clientSequence}`,
      phone: '11987654321',
      email: `cliente.${clientSequence}@example.com`,
      address: 'Rua das Palmeiras, 100',
      personType: PersonType.INDIVIDUAL,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    return { id: response.body?.id as string, payload, response };
  }

  async function createProject(
    token: string,
    clientId: string,
    overrides: Record<string, any> = {},
  ) {
    projectSequence += 1;
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

  // ===========================================================================
  // Cenário 1: Cadastro de cliente (Prioritário)
  // ===========================================================================
  describe('Cenário 1: Cadastro de cliente', () => {
    it('cadastra cliente PF com dados válidos e confirma persistência', async () => {
      const token = await authenticate();

      const payload = {
        name: 'Carlos Silva Fotógrafo',
        phone: '11987654321',
        email: 'carlos.silva@example.com',
        address: 'Av. Paulista, 1000',
        personType: PersonType.INDIVIDUAL,
      };

      const response = await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(payload.name);
      expect(response.body.phone).toBe(payload.phone);
      expect(response.body.email).toBe(payload.email);
      expect(response.body.address).toBe(payload.address);
      expect(response.body.personType).toBe(PersonType.INDIVIDUAL);
      expect(response.body).toHaveProperty('userId');

      // Confirmação de persistência via GET /clients/:id
      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/clients/${response.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.id).toBe(response.body.id);
      expect(getResponse.body.name).toBe(payload.name);
      expect(getResponse.body.personType).toBe(PersonType.INDIVIDUAL);
    });

    it('cadastra cliente PJ persistindo personType como company', async () => {
      const token = await authenticate();

      const payload = {
        name: 'Agência Criativa Ltda',
        phone: '11912345678',
        email: 'contato@agenciacriativa.com',
        address: 'Rua do Comércio, 500',
        personType: PersonType.COMPANY,
      };

      const response = await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(response.body.personType).toBe(PersonType.COMPANY);

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/clients/${response.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.personType).toBe(PersonType.COMPANY);
    });

    it('rejeita cadastro de cliente com nome duplicado para o mesmo usuário com 409 Conflict', async () => {
      const token = await authenticate();
      const sharedName = 'Cliente Nome Duplicado';

      await createClient(token, { name: sharedName });

      const response = await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: sharedName,
          phone: '11999998888',
        })
        .expect(409);

      expect(response.body.message).toBe(
        'Client with the same name already exists for this user.',
      );
    });

    it('permite que usuários diferentes cadastrem clientes com o mesmo nome', async () => {
      const user1Token = await authenticate('User 1');
      const user2Token = await authenticate('User 2');
      const clientName = 'Cliente Homônimo';

      await createClient(user1Token, { name: clientName });

      const response = await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: clientName,
          phone: '21988887777',
        })
        .expect(201);

      expect(response.body.name).toBe(clientName);
    });
  });

  // ===========================================================================
  // Cenário 2: Listagem de clientes (Prioritário)
  // ===========================================================================
  describe('Cenário 2: Listagem de clientes', () => {
    it('lista clientes cadastrados do usuário autenticado e isola de outros usuários', async () => {
      const user1Token = await authenticate('User 1');
      const client1 = await createClient(user1Token, { name: 'Cliente Alfa' });
      const client2 = await createClient(user1Token, { name: 'Cliente Beta' });

      // Usuário 2 com cliente próprio
      const user2Token = await authenticate('User 2');
      const clientUser2 = await createClient(user2Token, {
        name: 'Cliente Outro Usuário',
      });

      const response = await request(testSetup.app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      const ids = response.body.map((item: any) => item.id);
      expect(ids).toContain(client1.id);
      expect(ids).toContain(client2.id);
      expect(ids).not.toContain(clientUser2.id);
    });

    it('filtra clientes por nome com busca parcial', async () => {
      const token = await authenticate();
      const match = await createClient(token, { name: 'Mariana Duarte' });
      await createClient(token, { name: 'Roberto Carlos' });

      const response = await request(testSetup.app.getHttpServer())
        .get('/clients')
        .query({ name: 'Mariana' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(match.id);
      expect(response.body[0].name).toBe('Mariana Duarte');
    });

    it('filtra clientes por telefone', async () => {
      const token = await authenticate();
      const match = await createClient(token, { phone: '11977778888' });
      await createClient(token, { phone: '21933334444' });

      const response = await request(testSetup.app.getHttpServer())
        .get('/clients')
        .query({ phone: '97777' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(match.id);
      expect(response.body[0].phone).toBe('11977778888');
    });
  });

  // ===========================================================================
  // Cenário 3: Consulta por ID
  // ===========================================================================
  describe('Cenário 3: Consulta por ID', () => {
    it('consulta um cliente específico e retorna suas informações corretamente', async () => {
      const token = await authenticate();
      const { id: clientId, payload } = await createClient(token, {
        name: 'Juliana Costa',
        phone: '11966665555',
        email: 'juliana@example.com',
        address: 'Rua Central, 50',
        personType: PersonType.INDIVIDUAL,
      });

      const response = await request(testSetup.app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(clientId);
      expect(response.body.name).toBe(payload.name);
      expect(response.body.phone).toBe(payload.phone);
      expect(response.body.email).toBe(payload.email);
      expect(response.body.address).toBe(payload.address);
      expect(response.body.personType).toBe(payload.personType);
    });

    it('retorna 404 para cliente inexistente com UUID válido', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .get(`/clients/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('retorna 400 para ID com formato inválido', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .get('/clients/id-invalido-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  // ===========================================================================
  // Cenário 4: Atualização de cliente (Prioritário)
  // ===========================================================================
  describe('Cenário 4: Atualização de cliente via PATCH', () => {
    it('atualiza parcialmente dados do cliente mantendo os campos não enviados intactos', async () => {
      const token = await authenticate();
      const { id: clientId } = await createClient(token, {
        name: 'Nome Original',
        phone: '11911112222',
        email: 'original@example.com',
        address: 'Endereço Antigo',
        personType: PersonType.INDIVIDUAL,
      });

      // Atualiza apenas phone e address
      const patchResponse = await request(testSetup.app.getHttpServer())
        .patch(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '11999998888',
          address: 'Endereço Novo Atualizado',
        })
        .expect(200);

      expect(patchResponse.body.phone).toBe('11999998888');
      expect(patchResponse.body.address).toBe('Endereço Novo Atualizado');
      // Campos não enviados devem permanecer intactos
      expect(patchResponse.body.name).toBe('Nome Original');
      expect(patchResponse.body.email).toBe('original@example.com');
      expect(patchResponse.body.personType).toBe(PersonType.INDIVIDUAL);

      // Confirma persistência via GET /clients/:id
      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.phone).toBe('11999998888');
      expect(getResponse.body.address).toBe('Endereço Novo Atualizado');
      expect(getResponse.body.name).toBe('Nome Original');
    });

    it('retorna 404 ao tentar atualizar cliente inexistente via PATCH', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .patch(`/clients/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome Inexistente' })
        .expect(404);
    });
  });

  // ===========================================================================
  // Cenário 5: Exclusão de cliente
  // ===========================================================================
  it('Cenário 5: Exclusão de cliente e confirmação de remoção nas consultas', async () => {
    const token = await authenticate();
    const { id: clientId } = await createClient(token);

    // Exclusão bem-sucedida (204)
    await request(testSetup.app.getHttpServer())
      .delete(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Consulta direta por ID deve retornar 404
    await request(testSetup.app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    // Listagem geral não deve mais conter o ID
    const listResponse = await request(testSetup.app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids = listResponse.body.map((item: any) => item.id);
    expect(ids).not.toContain(clientId);
  });

  // ===========================================================================
  // Cenário 6: Campos obrigatórios (Prioritário)
  // ===========================================================================
  describe('Cenário 6: Validação de campos obrigatórios', () => {
    it('rejeita payload vazio com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('rejeita requisição sem o campo name com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11987654321' })
        .expect(400);
    });

    it('rejeita requisição sem o campo phone com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Sem Telefone' })
        .expect(400);
    });

    it('rejeita campo name vazio com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', phone: '11987654321' })
        .expect(400);
    });

    it('rejeita campo phone vazio com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nome Válido', phone: '' })
        .expect(400);
    });
  });

  // ===========================================================================
  // Cenário 7: Dados em formato inválido
  // ===========================================================================
  describe('Cenário 7: Rejeição de dados com formato inválido', () => {
    it('rejeita personType com valor fora do enum no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Cliente Tipo Inválido',
          phone: '11987654321',
          personType: 'tipo_inexistente',
        })
        .expect(400);
    });

    it('rejeita personType inválido na atualização via PATCH com 400', async () => {
      const token = await authenticate();
      const { id: clientId } = await createClient(token);

      await request(testSetup.app.getHttpServer())
        .patch(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ personType: 'outro_tipo' })
        .expect(400);
    });

    it('rejeita name não string no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 12345,
          phone: '11987654321',
        })
        .expect(400);
    });

    it('rejeita phone não string no cadastro com 400', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Nome Correto',
          phone: true,
        })
        .expect(400);
    });
  });

  // ===========================================================================
  // Cenário 9: Cliente com projetos associados (Prioritário)
  // ===========================================================================
  it('Cenário 9: Cliente com projetos associados mantém relação nas consultas', async () => {
    const token = await authenticate();
    const { id: clientId } = await createClient(token, {
      name: 'Cliente Com Projetos',
    });

    // Cria dois projetos vinculados ao cliente
    const project1 = await createProject(token, clientId, {
      title: 'Projeto Ensaio Externo',
    });
    const project2 = await createProject(token, clientId, {
      title: 'Projeto Álbum Casamento',
    });

    // Consulta via endpoint dedicado GET /clients/:id/projects
    const projectsResponse = await request(testSetup.app.getHttpServer())
      .get(`/clients/${clientId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(projectsResponse.body)).toBe(true);
    expect(projectsResponse.body).toHaveLength(2);

    const projectIds = projectsResponse.body.map((p: any) => p.id);
    expect(projectIds).toContain(project1.id);
    expect(projectIds).toContain(project2.id);

    // Consulta de projeto individual confirmando vínculo com o clientId
    const getProjectResponse = await request(testSetup.app.getHttpServer())
      .get(`/projects/${project1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getProjectProject(getProjectResponse.body, clientId));
  });

  function getProjectProject(body: any, clientId: string) {
    return body.clientId === clientId;
  }

  // ===========================================================================
  // Cenário 10: Exclusão de cliente com projetos (Prioritário)
  // ===========================================================================
  describe('Cenário 10: Regra de exclusão de cliente com projetos associados', () => {
    it('impede a exclusão sem confirmação retornando 409 CLIENT_HAS_PROJECTS', async () => {
      const token = await authenticate();
      const { id: clientId } = await createClient(token);

      const project = await createProject(token, clientId, {
        title: 'Projeto Bloqueador de Exclusão',
      });

      // Tentativa de excluir sem query confirm=true deve falhar com 409 Conflict
      const response = await request(testSetup.app.getHttpServer())
        .delete(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(response.body).toMatchObject({
        code: 'CLIENT_HAS_PROJECTS',
        projectCount: 1,
      });

      // Confirma que cliente permanece existindo
      await request(testSetup.app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Confirma que o projeto permanece existindo
      await request(testSetup.app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('permite exclusão com confirm=true removendo cliente e projetos associados em cascata', async () => {
      const token = await authenticate();
      const { id: clientId } = await createClient(token);

      const project = await createProject(token, clientId, {
        title: 'Projeto para Remoção em Cascata',
      });

      // Exclusão confirmada via ?confirm=true
      await request(testSetup.app.getHttpServer())
        .delete(`/clients/${clientId}`)
        .query({ confirm: 'true' })
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Cliente é removido
      await request(testSetup.app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Projetos vinculados também são removidos em cascata
      await request(testSetup.app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ===========================================================================
  // Cenário 14: Autenticação (Prioritário)
  // ===========================================================================
  describe('Cenário 14: Autenticação obrigatória nos endpoints de clientes', () => {
    it('rejeita GET /clients sem token com 401', async () => {
      await request(testSetup.app.getHttpServer()).get('/clients').expect(401);
    });

    it('rejeita GET /clients/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .get('/clients/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('rejeita GET /clients/:id/projects sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .get('/clients/00000000-0000-0000-0000-000000000000/projects')
        .expect(401);
    });

    it('rejeita POST /clients sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .post('/clients')
        .send({ name: 'Cliente Não Autenticado', phone: '11987654321' })
        .expect(401);
    });

    it('rejeita PATCH /clients/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .patch('/clients/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Nome Atualizado' })
        .expect(401);
    });

    it('rejeita DELETE /clients/:id sem token com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .delete('/clients/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });

    it('rejeita requisições com token inválido com 401', async () => {
      await request(testSetup.app.getHttpServer())
        .get('/clients')
        .set('Authorization', 'Bearer token_invalido_123')
        .expect(401);
    });
  });
});
