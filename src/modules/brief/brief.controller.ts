import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BriefService } from './brief.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Brief')
@Controller('v1/brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get comprehensive daily brief' })
  @ApiResponse({ status: 200, description: 'Daily brief with missions, achievements, and targets' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getTodaysBrief(@Req() req: any) {
    const userId = req.user?.id;
    return this.briefService.getTodaysBrief(userId);
  }
} 