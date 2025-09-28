import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BriefService } from './brief.service';

@ApiTags('Brief')
@Controller('v1/brief')
export class BriefController {
  constructor(private readonly brief: BriefService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today brief (habits, tasks, latest nudge)' })
  async today(@Query('userId') userId = 'demo-user-123') {
    return this.brief.getToday(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Alias for today' })
  async root(@Query('userId') userId = 'demo-user-123') {
    return this.brief.getToday(userId);
  }
} 