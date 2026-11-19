import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';
import {
  FinancialStatus,
  FinancialType,
} from '../../src/financial/model/financial.model';

describe('Financial (e2e)', () => {
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

  async function authenticate(name = 'Financial Test User'): Promise<string> {
    userSequence += 1;
    const user = {
      email: `financial-test-${userSequence}@example.com`,
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
    name = `Client ${Date.now()}-${userSequence}`,
  ): Promise<string> {
    const response = await request(testSetup.app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        phone: '11987654321',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: 'Rua de Teste, 100',
        personType: 'individual',
      })
      .expect(201);

    return response.body.id as string;
  }

  async function createProject(
    token: string,
    overrides: Record<string, any> = {},
  ): Promise<{ id: string; title: string }> {
    projectSequence += 1;
    const clientId = overrides.clientId ?? (await createClient(token));
    const title =
      overrides.title ?? `Projeto Teste ${Date.now()}-${projectSequence}`;

    const day = 10 + (projectSequence % 18);
    const defaultStartAt = `2026-11-${String(day).padStart(2, '0')}T10:00:00.000Z`;
    const defaultEndAt = `2026-11-${String(day).padStart(2, '0')}T12:00:00.000Z`;

    const payload = {
      clientId,
      title,
      local: 'Estúdio Principal',
      startAt: defaultStartAt,
      endAt: defaultEndAt,
      notes: 'Notas do projeto para teste financeiro',
      agreed_price: 1500.0,
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return { id: response.body.id as string, title };
  }

  async function createFinancialMovement(
    token: string,
    projectId: string,
    overrides: Record<string, any> = {},
  ) {
    const payload = {
      projectId,
      type: FinancialType.INCOME,
      status: FinancialStatus.PAID,
      value: 1000.0,
      date: '2026-11-19',
      description: 'Movimentação Financeira Padrão',
      ...overrides,
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/financial')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    return { response, payload, id: response.body?.id as string };
  }

  it('Cadastro de receita vinculada a um projeto existente', async () => {
    const token = await authenticate();
    const project = await createProject(token);

    const incomePayload = {
      projectId: project.id,
      type: FinancialType.INCOME,
      status: FinancialStatus.PAID,
      value: 2500.5,
      date: '2026-11-19',
      description: 'Receita de ensaio fotográfico',
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/financial')
      .set('Authorization', `Bearer ${token}`)
      .send(incomePayload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.projectId).toBe(project.id);
    expect(response.body.type).toBe(FinancialType.INCOME);
    expect(response.body.status).toBe(FinancialStatus.PAID);
    expect(Number(response.body.value)).toBe(2500.5);
    expect(response.body.description).toBe('Receita de ensaio fotográfico');
    expect(response.body.date).toBe('2026-11-19');
    expect(response.body).toHaveProperty('userId');
  });

  it('Cadastro de despesa vinculada a um projeto existente', async () => {
    const token = await authenticate();
    const project = await createProject(token);

    const expensePayload = {
      projectId: project.id,
      type: FinancialType.EXPENSE,
      status: FinancialStatus.PAID,
      value: 450.75,
      date: '2026-11-19',
      description: 'Despesa com aluguel de lentes',
    };

    const response = await request(testSetup.app.getHttpServer())
      .post('/financial')
      .set('Authorization', `Bearer ${token}`)
      .send(expensePayload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.projectId).toBe(project.id);
    expect(response.body.type).toBe(FinancialType.EXPENSE);
    expect(response.body.status).toBe(FinancialStatus.PAID);
    expect(Number(response.body.value)).toBe(450.75);
    expect(response.body.description).toBe('Despesa com aluguel de lentes');
    expect(response.body.date).toBe('2026-11-19');
    expect(response.body).toHaveProperty('userId');
  });

  it('Consulta de todas as movimentações e garantia de isolamento por usuário', async () => {
    const user1Token = await authenticate('User 1');
    const user1Project = await createProject(user1Token);

    const { id: movement1Id } = await createFinancialMovement(
      user1Token,
      user1Project.id,
      {
        type: FinancialType.INCOME,
        value: 1200.0,
        description: 'Receita User 1',
      },
    );

    const { id: movement2Id } = await createFinancialMovement(
      user1Token,
      user1Project.id,
      {
        type: FinancialType.EXPENSE,
        value: 300.0,
        description: 'Despesa User 1',
      },
    );

    const user2Token = await authenticate('User 2');
    const user2Project = await createProject(user2Token);
    const { id: movementUser2Id } = await createFinancialMovement(
      user2Token,
      user2Project.id,
      {
        type: FinancialType.INCOME,
        value: 999.0,
        description: 'Receita User 2',
      },
    );

    const response = await request(testSetup.app.getHttpServer())
      .get('/financial')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);

    const returnedIds = response.body.map((item: any) => item.id);
    expect(returnedIds).toContain(movement1Id);
    expect(returnedIds).toContain(movement2Id);
    expect(returnedIds).not.toContain(movementUser2Id);
  });

  it('Consulta de movimentações por projeto', async () => {
    const token = await authenticate();
    const projectA = await createProject(token, { title: 'Projeto A' });
    const projectB = await createProject(token, { title: 'Projeto B' });

    const { id: movA1 } = await createFinancialMovement(token, projectA.id, {
      type: FinancialType.INCOME,
      value: 1000.0,
      description: 'Entrada Projeto A',
    });
    const { id: movA2 } = await createFinancialMovement(token, projectA.id, {
      type: FinancialType.EXPENSE,
      value: 200.0,
      description: 'Saída Projeto A',
    });

    const { id: movB1 } = await createFinancialMovement(token, projectB.id, {
      type: FinancialType.INCOME,
      value: 3000.0,
      description: 'Entrada Projeto B',
    });

    const responseProjectA = await request(testSetup.app.getHttpServer())
      .get(`/financial/project/${projectA.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(responseProjectA.body)).toBe(true);
    expect(responseProjectA.body).toHaveLength(2);

    const idsProjectA = responseProjectA.body.map((item: any) => item.id);
    expect(idsProjectA).toContain(movA1);
    expect(idsProjectA).toContain(movA2);
    expect(idsProjectA).not.toContain(movB1);

    const responseProjectB = await request(testSetup.app.getHttpServer())
      .get(`/financial/project/${projectB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(responseProjectB.body)).toBe(true);
    expect(responseProjectB.body).toHaveLength(1);
    expect(responseProjectB.body[0].id).toBe(movB1);

    const balanceResponse = await request(testSetup.app.getHttpServer())
      .get(`/financial/project/${projectA.id}/balance`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Number(balanceResponse.text)).toBe(800);
  });

  describe('Consulta de movimentação por ID', () => {
    it('retorna os detalhes de uma movimentação existente', async () => {
      const token = await authenticate();
      const project = await createProject(token);

      const { id: movementId, payload } = await createFinancialMovement(
        token,
        project.id,
        {
          type: FinancialType.INCOME,
          status: FinancialStatus.PAID,
          value: 1800.0,
          date: '2026-11-19',
          description: 'Consulta por ID',
        },
      );

      const response = await request(testSetup.app.getHttpServer())
        .get(`/financial/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(movementId);
      expect(response.body.projectId).toBe(project.id);
      expect(response.body.type).toBe(payload.type);
      expect(response.body.status).toBe(payload.status);
      expect(Number(response.body.value)).toBe(payload.value);
      expect(response.body.description).toBe(payload.description);
    });

    it('retorna 404 quando o ID UUID não existe no banco', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .get(`/financial/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('retorna 400 quando o ID informado não é um UUID válido', async () => {
      const token = await authenticate();

      await request(testSetup.app.getHttpServer())
        .get('/financial/id-invalido-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Atualização parcial de movimentação via PATCH', () => {
    it('atualiza parcialmente campos da movimentação e persiste as alterações', async () => {
      const token = await authenticate();
      const project = await createProject(token);

      const { id: movementId } = await createFinancialMovement(
        token,
        project.id,
        {
          type: FinancialType.INCOME,
          status: FinancialStatus.PENDING,
          value: 1000.0,
          description: 'Descrição Original',
        },
      );

      const patchPayload = {
        value: 1550.25,
        status: FinancialStatus.PAID,
        description: 'Descrição Atualizada via PATCH',
      };

      const patchResponse = await request(testSetup.app.getHttpServer())
        .patch(`/financial/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchPayload)
        .expect(200);

      expect(patchResponse.body.id).toBe(movementId);
      expect(Number(patchResponse.body.value)).toBe(1550.25);
      expect(patchResponse.body.status).toBe(FinancialStatus.PAID);
      expect(patchResponse.body.description).toBe(
        'Descrição Atualizada via PATCH',
      );
      expect(patchResponse.body.type).toBe(FinancialType.INCOME);
      expect(patchResponse.body.projectId).toBe(project.id);

      const getResponse = await request(testSetup.app.getHttpServer())
        .get(`/financial/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Number(getResponse.body.value)).toBe(1550.25);
      expect(getResponse.body.status).toBe(FinancialStatus.PAID);
      expect(getResponse.body.description).toBe(
        'Descrição Atualizada via PATCH',
      );
    });

    it('retorna 404 ao tentar atualizar movimentação inexistente via PATCH', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .patch(`/financial/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Tentativa de alteração' })
        .expect(404);
    });
  });

  describe('Exclusão de movimentação', () => {
    it('exclui a movimentação e retorna 204 No Content', async () => {
      const token = await authenticate();
      const project = await createProject(token);

      const { id: movementId } = await createFinancialMovement(
        token,
        project.id,
      );

      await request(testSetup.app.getHttpServer())
        .delete(`/financial/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(testSetup.app.getHttpServer())
        .get(`/financial/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      const listResponse = await request(testSetup.app.getHttpServer())
        .get('/financial')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const ids = listResponse.body.map((item: any) => item.id);
      expect(ids).not.toContain(movementId);
    });

    it('retorna 404 ao tentar excluir movimentação inexistente', async () => {
      const token = await authenticate();
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(testSetup.app.getHttpServer())
        .delete(`/financial/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
  describe('Verificação da atualização dos indicadores do Dashboard após alterações financeiras', () => {
    it('atualiza os indicadores após alterações financeiras', async () => {
      const token = await authenticate();
      const project = await createProject(token);

      const initialDashboard = await request(testSetup.app.getHttpServer())
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(initialDashboard.body.financial).toEqual({
        incomePaid: 0,
        expensePaid: 0,
        monthlyResult: 0,
      });

      const { id: pendingMovementId } = await createFinancialMovement(
        token,
        project.id,
        {
          type: FinancialType.INCOME,
          status: FinancialStatus.PENDING,
          value: 1000.0,
          date: '2026-11-05',
          description: 'Receita Pendente',
        },
      );

      const dashboardAfterPending = await request(testSetup.app.getHttpServer())
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardAfterPending.body.financial).toEqual({
        incomePaid: 0,
        expensePaid: 0,
        monthlyResult: 0,
      });

      await createFinancialMovement(token, project.id, {
        type: FinancialType.INCOME,
        status: FinancialStatus.PAID,
        value: 2500.0,
        date: '2026-11-10',
        description: 'Receita Paga',
      });

      const dashboardAfterPaidIncome = await request(
        testSetup.app.getHttpServer(),
      )
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardAfterPaidIncome.body.financial).toEqual({
        incomePaid: 2500,
        expensePaid: 0,
        monthlyResult: 2500,
      });

      const { id: expenseMovementId } = await createFinancialMovement(
        token,
        project.id,
        {
          type: FinancialType.EXPENSE,
          status: FinancialStatus.PAID,
          value: 700.0,
          date: '2026-11-15',
          description: 'Despesa Paga',
        },
      );

      const dashboardAfterPaidExpense = await request(
        testSetup.app.getHttpServer(),
      )
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardAfterPaidExpense.body.financial).toEqual({
        incomePaid: 2500,
        expensePaid: 700,
        monthlyResult: 1800, // 2500 - 700
      });

      await request(testSetup.app.getHttpServer())
        .patch(`/financial/${pendingMovementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: FinancialStatus.PAID })
        .expect(200);

      const dashboardAfterPatchStatus = await request(
        testSetup.app.getHttpServer(),
      )
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardAfterPatchStatus.body.financial).toEqual({
        incomePaid: 3500, // 2500 + 1000
        expensePaid: 700,
        monthlyResult: 2800, // 3500 - 700
      });

      await request(testSetup.app.getHttpServer())
        .delete(`/financial/${expenseMovementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const dashboardAfterDeleteExpense = await request(
        testSetup.app.getHttpServer(),
      )
        .get('/dashboard?month=11&year=2026')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardAfterDeleteExpense.body.financial).toEqual({
        incomePaid: 3500,
        expensePaid: 0,
        monthlyResult: 3500,
      });
    });

    describe('Validação de valores financeiros inválidos', () => {
      it('rejeita valor negativo no cadastro', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: FinancialType.INCOME,
            status: FinancialStatus.PAID,
            value: -100.0,
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita valor zero no cadastro', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: FinancialType.INCOME,
            status: FinancialStatus.PAID,
            value: 0,
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita valor com mais de duas casas decimais no cadastro', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: FinancialType.INCOME,
            status: FinancialStatus.PAID,
            value: 125.456,
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita valor não numérico no cadastro', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: FinancialType.INCOME,
            status: FinancialStatus.PAID,
            value: 'duzentos',
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita tipo financeiro inválido', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: 'tipo_invalido',
            status: FinancialStatus.PAID,
            value: 150.0,
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita status financeiro inválido', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({
            projectId: project.id,
            type: FinancialType.INCOME,
            status: 'status_invalido',
            value: 150.0,
            date: '2026-11-19',
          })
          .expect(400);
      });

      it('rejeita requisição sem campos obrigatórios', async () => {
        const token = await authenticate();

        await request(testSetup.app.getHttpServer())
          .post('/financial')
          .set('Authorization', `Bearer ${token}`)
          .send({})
          .expect(400);
      });

      it('rejeita atualização via PATCH com valor negativo', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        const { id: movementId } = await createFinancialMovement(
          token,
          project.id,
        );

        await request(testSetup.app.getHttpServer())
          .patch(`/financial/${movementId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ value: -50.0 })
          .expect(400);
      });

      it('rejeita atualização via PATCH com mais de duas casas decimais', async () => {
        const token = await authenticate();
        const project = await createProject(token);

        const { id: movementId } = await createFinancialMovement(
          token,
          project.id,
        );

        await request(testSetup.app.getHttpServer())
          .patch(`/financial/${movementId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ value: 100.999 })
          .expect(400);
      });
    });
  });
});
