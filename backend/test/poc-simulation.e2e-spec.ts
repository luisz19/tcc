import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup } from './utils/test-setup';
import { PersonType } from '../src/clients/model/clients.model';
import { ProjectStatus, ProjectType } from '../src/project/model/project.model';
import {
  FinancialStatus,
  FinancialType,
} from '../src/financial/model/financial.model';

describe('Simulação de uso da PoC (e2e)', () => {
  let testSetup: TestSetup;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
    await testSetup.teardown();
  });

  it('Executa o fluxo completo da PoC: Autenticação -> Cliente -> Pacote -> Projeto -> Receita -> Despesa -> Consulta Financeira -> Consulta Projeto -> Dashboard', async () => {
    const server = testSetup.app.getHttpServer();

    // 1. Autenticação: Usuário realiza login e obtém acesso à API
    const userCredentials = {
      name: 'Fotógrafo Profissional PoC',
      email: 'fotografo.poc@aperture.com',
      password: 'Password123!',
    };

    await request(server)
      .post('/auth/register')
      .send(userCredentials)
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.password,
      })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('accessToken');
    const authToken = loginResponse.body.accessToken as string;
    expect(typeof authToken).toBe('string');

    // Validação do perfil autenticado
    const profileResponse = await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileResponse.body.email).toBe(userCredentials.email);
    expect(profileResponse.body.name).toBe(userCredentials.name);

    // 2. Cadastro de cliente: Registra cliente com dados pessoais e de contato
    const clientPayload = {
      name: 'Mariana Alcantara',
      phone: '11987654321',
      email: 'mariana.alcantara@example.com',
      address: 'Av. das Acácias, 150 - Jardins, São Paulo/SP',
      personType: PersonType.INDIVIDUAL,
    };

    const clientResponse = await request(server)
      .post('/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send(clientPayload)
      .expect(201);

    expect(clientResponse.body).toHaveProperty('id');
    expect(clientResponse.body.name).toBe(clientPayload.name);
    expect(clientResponse.body.phone).toBe(clientPayload.phone);
    expect(clientResponse.body.email).toBe(clientPayload.email);
    expect(clientResponse.body.address).toBe(clientPayload.address);
    expect(clientResponse.body.personType).toBe(PersonType.INDIVIDUAL);

    const clientId = clientResponse.body.id as string;

    // 3. Cadastro de pacote: Registra pacote fotográfico com descrição e valor
    const packagePayload = {
      name: 'Pacote Casamento Ouro',
      description:
        'Cobertura completa com 2 fotógrafos, making of, cerimônia, festa e álbum 30x30',
      base_price: 3500.0,
    };

    const packageResponse = await request(server)
      .post('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send(packagePayload)
      .expect(201);

    expect(packageResponse.body).toHaveProperty('id');
    expect(packageResponse.body.name).toBe(packagePayload.name);
    expect(packageResponse.body.description).toBe(packagePayload.description);
    expect(Number(packageResponse.body.base_price)).toBe(3500.0);

    const packageId = packageResponse.body.id as string;

    // 4. Criação de projeto: Cria projeto associado ao cliente e ao pacote
    const projectPayload = {
      clientId,
      packageId,
      title: 'Casamento Mariana & Rodrigo',
      local: 'Villa Bisutti - São Paulo/SP',
      project_type: ProjectType.PHOTO_SESSION,
      status: ProjectStatus.CONFIRMED,
      startAt: '2026-12-15T14:00:00.000Z',
      endAt: '2026-12-15T22:00:00.000Z',
      notes: 'Cerimônia religiosa às 16h; fotos com padrinhos das 18h às 19h',
      agreed_price: 3500.0,
    };

    const projectResponse = await request(server)
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectPayload)
      .expect(201);

    expect(projectResponse.body).toHaveProperty('id');
    expect(projectResponse.body.title).toBe(projectPayload.title);
    expect(projectResponse.body.clientId).toBe(clientId);
    expect(projectResponse.body.packageId).toBe(packageId);
    expect(projectResponse.body.status).toBe(ProjectStatus.CONFIRMED);
    expect(Number(projectResponse.body.agreed_price)).toBe(3500.0);

    const projectId = projectResponse.body.id as string;

    // 5. Registro financeiro: Registra receita vinculada ao projeto
    const incomePayload = {
      projectId,
      type: FinancialType.INCOME,
      status: FinancialStatus.PAID,
      value: 3500.0,
      date: '2026-12-15',
      description: 'Pagamento integral do Pacote Casamento Ouro',
    };

    const incomeResponse = await request(server)
      .post('/financial')
      .set('Authorization', `Bearer ${authToken}`)
      .send(incomePayload)
      .expect(201);

    expect(incomeResponse.body).toHaveProperty('id');
    expect(incomeResponse.body.projectId).toBe(projectId);
    expect(incomeResponse.body.type).toBe(FinancialType.INCOME);
    expect(incomeResponse.body.status).toBe(FinancialStatus.PAID);
    expect(Number(incomeResponse.body.value)).toBe(3500.0);
    expect(incomeResponse.body.description).toBe(incomePayload.description);

    const incomeId = incomeResponse.body.id as string;

    // 6. Registro de despesa: Registra despesa vinculada ao mesmo projeto
    const expensePayload = {
      projectId,
      type: FinancialType.EXPENSE,
      status: FinancialStatus.PAID,
      value: 600.0,
      date: '2026-12-15',
      description: 'Cachê do fotógrafo assistente e locação de iluminadores',
    };

    const expenseResponse = await request(server)
      .post('/financial')
      .set('Authorization', `Bearer ${authToken}`)
      .send(expensePayload)
      .expect(201);

    expect(expenseResponse.body).toHaveProperty('id');
    expect(expenseResponse.body.projectId).toBe(projectId);
    expect(expenseResponse.body.type).toBe(FinancialType.EXPENSE);
    expect(expenseResponse.body.status).toBe(FinancialStatus.PAID);
    expect(Number(expenseResponse.body.value)).toBe(600.0);
    expect(expenseResponse.body.description).toBe(expensePayload.description);

    const expenseId = expenseResponse.body.id as string;

    // 7. Consulta financeira: Consulta movimentações e verifica valores
    // 7.1 Todas as movimentações do usuário
    const allFinancialResponse = await request(server)
      .get('/financial')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(allFinancialResponse.body)).toBe(true);
    expect(allFinancialResponse.body).toHaveLength(2);

    const financialIds = allFinancialResponse.body.map((item: any) => item.id);
    expect(financialIds).toContain(incomeId);
    expect(financialIds).toContain(expenseId);

    // 7.2 Movimentações específicas vinculadas ao projeto
    const projectFinancialResponse = await request(server)
      .get(`/financial/project/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(projectFinancialResponse.body)).toBe(true);
    expect(projectFinancialResponse.body).toHaveLength(2);
    expect(
      projectFinancialResponse.body.every(
        (m: any) => m.projectId === projectId,
      ),
    ).toBe(true);

    // 7.3 Saldo financeiro do projeto
    const projectBalanceResponse = await request(server)
      .get(`/financial/project/${projectId}/balance`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Number(projectBalanceResponse.text)).toBe(2900.0);

    // 7.4 Resumo mensal financeiro (mês 12 / ano 2026)
    const monthlyFinancialResponse = await request(server)
      .get('/financial/monthly?month=12&year=2026')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(monthlyFinancialResponse.body.summary).toEqual({
      incomePaid: 3500.0,
      expensePaid: 600.0,
      monthlyResult: 2900.0,
    });

    // 8. Consulta do projeto: Verifica relacionamentos e informações consistentes
    // 8.1 Consulta direta do projeto por ID
    const getProjectResponse = await request(server)
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getProjectResponse.body.id).toBe(projectId);
    expect(getProjectResponse.body.title).toBe(projectPayload.title);
    expect(getProjectResponse.body.clientId).toBe(clientId);
    expect(getProjectResponse.body.packageId).toBe(packageId);
    expect(getProjectResponse.body.local).toBe(projectPayload.local);
    expect(getProjectResponse.body.notes).toBe(projectPayload.notes);
    expect(getProjectResponse.body.status).toBe(ProjectStatus.CONFIRMED);
    expect(Number(getProjectResponse.body.agreed_price)).toBe(3500.0);

    // 8.2 Consulta dos projetos associados ao cliente
    const clientProjectsResponse = await request(server)
      .get(`/clients/${clientId}/projects`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(clientProjectsResponse.body)).toBe(true);
    expect(clientProjectsResponse.body).toHaveLength(1);
    expect(clientProjectsResponse.body[0].id).toBe(projectId);
    expect(clientProjectsResponse.body[0].title).toBe(projectPayload.title);

    // 9. Consulta o dashboard: Indicadores e dados consolidados
    const dashboardResponse = await request(server)
      .get('/dashboard?month=12&year=2026')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Período
    expect(dashboardResponse.body.period).toEqual({
      month: 12,
      year: 2026,
    });

    // Indicadores Financeiros (Receitas pagas, Despesas pagas, Resultado mensal)
    expect(dashboardResponse.body.financial).toEqual({
      incomePaid: 3500.0,
      expensePaid: 600.0,
      monthlyResult: 2900.0,
    });

    // Total de clientes do usuário
    expect(dashboardResponse.body.clients).toEqual({
      totalClients: 1,
    });

    // Total de projetos e listagem com relacionamento de cliente
    expect(dashboardResponse.body.projects.totalActive).toBe(1);
    expect(dashboardResponse.body.projects.upcomingProjects).toHaveLength(1);

    const upcomingProject = dashboardResponse.body.projects.upcomingProjects[0];
    expect(upcomingProject.id).toBe(projectId);
    expect(upcomingProject.title).toBe(projectPayload.title);
    expect(upcomingProject.clientName).toBe(clientPayload.name);
    expect(upcomingProject.local).toBe(projectPayload.local);
    expect(upcomingProject.status).toBe(ProjectStatus.CONFIRMED);
    expect(Number(upcomingProject.agreed_price)).toBe(3500.0);
  });
});
