import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NudgesService } from './nudges.service';

@ApiTags('Nudges')
@Controller('v1')
export class NudgesController {
  constructor(private readonly nudgesService: NudgesService) {}

  @Get('nudge')
  @ApiOperation({ summary: 'Get AI nudge based on user progress' })
  @ApiResponse({ status: 200, description: 'Nudge retrieved' })
  @ApiBearerAuth()
  async getNudge(@Req() req: any) {
    return this.nudgesService.generateNudge('demo-user-123');
  }
} 