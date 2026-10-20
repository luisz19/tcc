import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Financial } from './entities/financial.entity';
import { Repository } from 'typeorm';
import { UpdateFinancialDto } from './dto/update-financial';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { validateMoney } from 'src/common/validators/money.validator';
import { FinancialStatus, FinancialType } from './model/financial.model';

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
