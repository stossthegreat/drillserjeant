import { Controller, Get } from '@nestjs/common';
import { BriefService } from './brief.service';

@Controller('v1/brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get()
  async getBrief() {
    return this.briefService.getTodaysBrief('demo-user-123');
  }

  @Get('today')
  async getTodaysBrief() {
    return this.briefService.getTodaysBrief('demo-user-123');
  }
} 