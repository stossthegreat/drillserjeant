import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('v1/events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Record an event (memory)' })
  async create(@Body() body: any) {
    const { userId = 'demo-user-123', type, payload = {} } = body || {};
    return this.events.record(userId, type, payload);
  }

  @Get()
  @ApiOperation({ summary: 'List events' })
  async list(@Query('userId') userId = 'demo-user-123', @Query('limit') limit = '100') {
    return this.events.list(userId, Number(limit));
  }
} 