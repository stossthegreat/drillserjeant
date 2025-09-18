import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StreaksService } from './streaks.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Streaks')
@Controller('v1/streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'User achievements retrieved' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getAchievements(@Req() req: any) {
    return this.streaksService.getUserAchievements(req.user?.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get streak summary' })
  @ApiResponse({ status: 200, description: 'Streak summary retrieved' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getStreakSummary(@Req() req: any) {
    return this.streaksService.getStreakSummary(req.user?.id);
  }
} 