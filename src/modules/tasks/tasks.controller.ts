import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List user tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  @ApiBearerAuth()
  async list(@Req() req: any) {
    return this.tasksService.list('demo-user-123');
  }

  @Post()
  @ApiOperation({ summary: 'Create new task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() createData: any) {
    return this.tasksService.create('demo-user-123', createData);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  @ApiBearerAuth()
  async complete(@Req() req: any, @Param('id') id: string) {
    await this.tasksService.completeTask(id, 'demo-user-123');
    return { ok: true, timestamp: new Date().toISOString() };
  }
} 