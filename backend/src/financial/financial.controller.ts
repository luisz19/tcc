import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  FinancialService,
  MonthlyFinancialResponse,
} from './financial.service';
import { Financial } from './entities/financial.entity';
import { findOneParams } from 'src/find-one.params';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('financial')
@UseGuards(AuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  public async findAll(@CurrentUser() userId: string): Promise<Financial[]> {
    return this.financialService.findAll(userId);
  }

  @Get('/monthly')
  public async findFinancialByMonth(
    @CurrentUser() userId: string,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ): Promise<MonthlyFinancialResponse> {
    return this.financialService.findFinancialByMonth(userId, month, year);
  }

  @Get('/:id')
  public async findOne(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
  ): Promise<Financial> {
    return this.financialService.findOneOrFail(params.id, userId);
  }

  @Get('/project/:projectId/balance')
  public async showProjectBalance(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<number> {
    return this.financialService.showProjectBalance(projectId, userId);
  }

  @Get('/project/:projectId')
  public async findFinancialByProjectId(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<Financial[]> {
    return this.financialService.findFinancialByProjectId(projectId, userId);
  }

  @Post()
  public async createFinancial(
    @Body() createFinancialDto: CreateFinancialDto,
    @CurrentUser() userId: string,
  ): Promise<Financial> {
    return this.financialService.createFinancial({
      ...createFinancialDto,
      userId,
    });
  }

  @Patch('/:id')
  public async updateFinancial(
    @Param() params: findOneParams,
    @Body() updateFinancialDto: UpdateFinancialDto,
    @CurrentUser() userId: string,
  ): Promise<Financial> {
    return this.financialService.updateFinancial(
      params.id,
      updateFinancialDto,
      userId,
    );
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteFinancial(
    @Param() params: findOneParams,
    @CurrentUser() userId: string,
  ): Promise<void> {
    return this.financialService.deleteFinancial(params.id, userId);
  }
}
