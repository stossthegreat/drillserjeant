import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly report card' })
  async weekly(@Req() req: any, @Query('week') week?: string) {
    const userId = req.user?.id || 'demo-user-123';
    return this.reports.getWeeklyReport(userId, week);
  }
} 