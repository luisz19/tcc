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
import { CurrentUserId } from 'src/user/decorators/current-user-id.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('financial')
@UseGuards(AuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  public async findAll(@CurrentUserId() userId: string): Promise<Financial[]> {
    return this.financialService.findAll(userId);
  }

  @Get('/monthly')
  public async findFinancialByMonth(
    @CurrentUserId() userId: string,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ): Promise<MonthlyFinancialResponse> {
    return this.financialService.findFinancialByMonth(userId, month, year);
  }

  @Get('/:id')
  public async findOne(@Param() params: findOneParams): Promise<Financial> {
    return this.financialService.findOneOrFail(params.id);
  }

  @Get('/project/:projectId/balance')
  public async showProjectBalance(
    @Param('projectId') projectId: string,
  ): Promise<number> {
    return this.financialService.showProjectBalance(projectId);
  }

  @Get('/project/:projectId')
  public async findFinancialByProjectId(
    @Param('projectId') projectId: string,
  ): Promise<Financial[]> {
    return this.financialService.findFinancialByProjectId(projectId);
  }

  @Post()
  public async createFinancial(
    @Body() createFinancialDto: CreateFinancialDto,
    @CurrentUserId() userId: string,
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
  ): Promise<Financial> {
    return this.financialService.updateFinancial(params.id, updateFinancialDto);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteFinancial(@Param() params: findOneParams): Promise<void> {
    return this.financialService.deleteFinancial(params.id);
  }
}
