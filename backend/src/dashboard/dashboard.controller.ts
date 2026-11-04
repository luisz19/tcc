import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUserId } from 'src/user/decorators/current-user-id.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { DashboardSummaryResponse } from './interface/dashboard-summary.interface';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly DashboardService: DashboardService) {}

  @Get()
  public async getDashboardSummary(
    @CurrentUserId() userId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ): Promise<DashboardSummaryResponse> {
    const monthNumber = month ? parseInt(month.toString(), 10) : undefined;
    const yearNumber = year ? parseInt(year.toString(), 10) : undefined;

    return this.DashboardService.getDashboardSummary(
      userId,
      monthNumber,
      yearNumber,
    );
  }
}
