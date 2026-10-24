import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Financial } from './entities/financial.entity';
import { Repository } from 'typeorm';
import { UpdateFinancialDto } from './dto/update-financial';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { validateMoney } from 'src/common/validators/money.validator';
import { FinancialStatus, FinancialType } from './model/financial.model';

export interface MonthlyFinancialSummary {
  incomePaid: number;
  expensePaid: number;
  monthlyResult: number;
}

export interface MonthlyFinancialResponse {
  summary: MonthlyFinancialSummary;
  financials: Financial[];
}

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Financial)
    private readonly financialRepository: Repository<Financial>,
  ) {}

  async findAll(userId: string): Promise<Financial[]> {
    const query = this.financialRepository.createQueryBuilder('financial');
    query.where('financial.userId = :userId', { userId });
    return query.getMany();
  }

  async findOneOrFail(id: string): Promise<Financial> {
    const financial = await this.financialRepository.findOneBy({ id });

    if (!financial) {
      throw new NotFoundException();
    }

    return financial;
  }

  async findOne(id: string): Promise<Financial> {
    const financial = await this.findOneOrFail(id);
    return financial;
  }

  async createFinancial(
    createFinancialDto: CreateFinancialDto,
  ): Promise<Financial> {
    const financial = this.financialRepository.create(createFinancialDto);

    this.validateAmount(financial.value);

    const formatedPrice = Math.round(financial.value * 100) / 100;

    financial.value = formatedPrice;

    return await this.financialRepository.save(financial);
  }

  async updateFinancial(
    id: string,
    updateFinancialDto: UpdateFinancialDto,
  ): Promise<Financial> {
    const financial = await this.findOneOrFail(id);

    Object.assign(financial, updateFinancialDto);
    return this.financialRepository.save(financial);
  }

  async showProjectBalance(projectId: string): Promise<number> {
    const balance = await this.calculateProjectBalance(projectId);
    return balance;
  }

  async findFinancialByMonth(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<MonthlyFinancialResponse> {
    if (month === undefined && year === undefined) {
      throw new BadRequestException('Month or year must be provided.');
    }

    if (
      month !== undefined &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      throw new BadRequestException('Month must be between 1 and 12.');
    }

    if (year !== undefined && (!Number.isInteger(year) || year < 1)) {
      throw new BadRequestException('Year must be a positive integer.');
    }

    const selectedYear = year ?? new Date().getFullYear();
    const startMonth = month ?? 1;
    const isFullYear = month === undefined;
    const endYear =
      isFullYear || startMonth === 12 ? selectedYear + 1 : selectedYear;
    const endMonth = isFullYear || startMonth === 12 ? 1 : startMonth + 1;
    const startDate = `${selectedYear}-${String(startMonth).padStart(2, '0')}-01`;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const financials = await this.financialRepository
      .createQueryBuilder('financial')
      .where('financial.userId = :userId', { userId })
      .andWhere('financial.date >= :startDate AND financial.date < :endDate', {
        startDate,
        endDate,
      })
      .orderBy('financial.date', 'DESC')
      .getMany();

    const paidFinancials = financials.filter(
      (item) => item.status === FinancialStatus.PAID,
    );

    const incomePaid = paidFinancials
      .filter((item) => item.type === FinancialType.INCOME)
      .reduce((acc, item) => acc + (Number(item.value) || 0), 0);

    const expensePaid = paidFinancials
      .filter((item) => item.type === FinancialType.EXPENSE)
      .reduce((acc, item) => acc + (Number(item.value) || 0), 0);

    const monthlyResult = Math.round((incomePaid - expensePaid) * 100) / 100;

    return {
      summary: {
        incomePaid: Math.round(incomePaid * 100) / 100,
        expensePaid: Math.round(expensePaid * 100) / 100,
        monthlyResult,
      },
      financials,
    };
  }

  async findFinancialByProjectId(projectId: string): Promise<Financial[]> {
    const financials = await this.financialRepository.find({
      where: {
        project: { id: projectId },
      },
    });

    if (!financials || financials.length === 0) {
      throw new NotFoundException(
        'No financial records found for this project.',
      );
    }

    return financials;
  }

  async deleteFinancial(id: string): Promise<void> {
    const financial = await this.findOneOrFail(id);

    await this.financialRepository.delete(financial.id);
  }

  private validateAmount(value: number): void {
    validateMoney(value, {
      fieldName: 'value',
    });
  }

  private async calculateProjectBalance(projectId: string): Promise<number> {
    const movements = await this.financialRepository.find({
      where: {
        project: { id: projectId },
        status: FinancialStatus.PAID,
      },
    });

    return movements.reduce((balance, movement) => {
      const value = Number(movement.value);

      if (movement.type === FinancialType.INCOME) {
        return balance + value;
      }

      return balance - value;
    }, 0);
  }
}
