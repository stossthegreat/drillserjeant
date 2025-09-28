import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlarmsService } from './alarms.service';

@ApiTags('Alarms')
@Controller('v1/alarms')
export class AlarmsController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get()
  @ApiOperation({ summary: 'List alarms' })
  async list(@Req() req: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.alarms.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create alarm' })
  async create(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id || 'demo-user-123';
    return this.alarms.create(userId, body);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss alarm' })
  async dismiss(@Param('id') id: string) {
    return this.alarms.dismiss(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alarm' })
  async remove(@Param('id') id: string) {
    return this.alarms.remove(id);
  }
} 