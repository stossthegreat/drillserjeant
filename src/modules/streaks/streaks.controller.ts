import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StreaksService } from './streaks.service';

@ApiTags('Streaks')
@Controller('v1/streaks')
export class StreaksController {
  constructor(private readonly streaks: StreaksService) {}

  @Get('achievements')
  @ApiOperation({ summary: 'Get achievements' })
  async achievements(@Req() req: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.streaks.getAchievements(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get streak summary' })
  async summary(@Req() req: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.streaks.getSummary(userId);
  }
} 