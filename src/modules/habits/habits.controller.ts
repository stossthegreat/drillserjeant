import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { HabitsService } from './habits.service';

@ApiTags('Habits')
@Controller('v1/habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'List user habits' })
  @ApiResponse({ status: 200, description: 'Habits retrieved' })
  @ApiBearerAuth()
  async list(@Req() req: any) {
    return this.habitsService.list('demo-user-123');
  }

  @Post()
  @ApiOperation({ summary: 'Create new habit' })
  @ApiResponse({ status: 201, description: 'Habit created' })
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() createData: any) {
    return this.habitsService.create('demo-user-123', createData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update habit' })
  @ApiResponse({ status: 200, description: 'Habit updated' })
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.habitsService.update(id, updateData);
  }

  @Post(':id/tick')
  @ApiOperation({ summary: 'Mark habit as completed (idempotent)' })
  @ApiResponse({ status: 200, description: 'Habit ticked' })
  @ApiBearerAuth()
  @ApiSecurity('IdempotencyKey')
  async tick(@Req() req: any, @Param('id') id: string) {
    const idempotencyKey = req.headers['idempotency-key'];
    await this.habitsService.tick('demo-user-123', id, idempotencyKey);
    return { ok: true, timestamp: new Date().toISOString() };
  }
} 