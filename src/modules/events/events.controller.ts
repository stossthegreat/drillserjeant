import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('v1/events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List user events' })
  async list(@Req() req: any, @Query('limit') limit?: string) {
    const userId = req.user?.id || 'demo-user-123';
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.events.list(userId, limitNum);
  }

  @Post()
  @ApiOperation({ summary: 'Create an event' })
  async create(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.events.create(userId, body.type, body.payload);
  }
} 