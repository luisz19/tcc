import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/clients/entities/client.entity';
import { FinancialService } from 'src/financial/financial.service';
import { Project } from 'src/project/entities/project.entity';
import { Repository } from 'typeorm';
import { DashboardSummaryResponse } from './interface/dashboard-summary.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly financialService: FinancialService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async getDashboardSummary(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<DashboardSummaryResponse> {
    const financialData = await this.financialService.findFinancialByMonth(
      userId,
      month,
      year,
    );

    const upcomingProjects = await this.projectRepository.find({
      where: { userId },
      take: 5,
      order: { startAt: 'ASC' },
      relations: { client: true },
    });

    const totalClients = await this.clientRepository.count({
      where: { userId },
    });

    return {
      period: {
        month: month ?? new Date().getMonth() + 1,
        year: year ?? new Date().getFullYear(),
      },
      financial: {
        incomePaid: financialData.summary.incomePaid,
        expensePaid: financialData.summary.expensePaid,
        monthlyResult: financialData.summary.monthlyResult,
      },
      projects: {
        totalActive: upcomingProjects.length,
        upcomingProjects: upcomingProjects.map((project) => ({
          id: project.id,
          title: project.title,
          clientName: project.client?.name || 'Cliente não associado',
          startAt: project.startAt,
          status: project.status,
        })),
      },
      clients: {
        totalClients,
      },
    };
  }
}
