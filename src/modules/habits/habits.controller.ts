import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HabitsService } from './habits.service';

@ApiTags('Habits')
@Controller('v1/habits')
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'List habits for user' })
  async list(@Req() req: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.habits.list(userId);
  }

  @Post(':id/tick')
  @ApiOperation({ summary: 'Tick habit for today (idempotent)' })
  async tick(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'demo-user-123';
    return this.habits.tick(userId, id);
  }
} 