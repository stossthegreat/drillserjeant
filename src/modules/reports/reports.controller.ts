import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  async getDailyReport(@Query('date') date?: string) {
    return this.reportsService.generateDailyReport('demo-user-123', date);
  }

  @Get('weekly')
  async getWeeklyReport(@Query('week') week?: string) {
    return this.reportsService.generateWeeklyReport('demo-user-123', week);
  }

  @Get('morning-brief')
  async getMorningBrief() {
    return this.reportsService.generateMorningBrief('demo-user-123');
  }

  @Get('evening-summary')
  async getEveningSummary() {
    return this.reportsService.generateEveningSummary('demo-user-123');
  }
} 