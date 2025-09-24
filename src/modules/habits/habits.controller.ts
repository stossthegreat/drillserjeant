import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { HabitsService } from './habits.service';

@Controller('v1/habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async list() {
    return this.habitsService.list('demo-user-123');
  }

  @Post()
  async create(@Body() habitData: any) {
    return this.habitsService.create('demo-user-123', habitData);
  }

  @Post(':id/tick')
  async tick(@Param('id') id: string) {
    return this.habitsService.tick(id, 'demo-user-123');
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.habitsService.update(id, 'demo-user-123', updateData);
  }
} 