import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlarmsService } from './alarms.service';

@ApiTags('Alarms')
@Controller('v1/alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Get()
  @ApiOperation({ summary: 'List user alarms' })
  @ApiResponse({ status: 200, description: 'Alarms retrieved' })
  @ApiBearerAuth()
  async list(@Req() req: any) {
    return this.alarmsService.list('demo-user-123');
  }

  @Post()
  @ApiOperation({ summary: 'Create new alarm' })
  @ApiResponse({ status: 201, description: 'Alarm created' })
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() createData: any) {
    return this.alarmsService.create('demo-user-123', createData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alarm' })
  @ApiResponse({ status: 200, description: 'Alarm updated' })
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.alarmsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alarm' })
  @ApiResponse({ status: 200, description: 'Alarm deleted' })
  @ApiBearerAuth()
  async delete(@Param('id') id: string) {
    return this.alarmsService.delete(id);
  }
} 