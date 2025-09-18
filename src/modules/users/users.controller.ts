import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiBearerAuth()
  async getMe(@Req() req: any) {
    // Mock user for now - will integrate Firebase Auth later
    return {
      id: 'demo-user-123',
      email: 'demo@drillsergeant.com',
      tone: 'balanced',
      intensity: 2,
      consentRoast: false,
      plan: 'FREE',
      features: {
        canUseDynamicTts: false,
        llmQuotaRemaining: 40,
        ttsQuotaRemaining: 2500,
      },
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  @ApiBearerAuth()
  async updateMe(@Req() req: any, @Body() updateData: any) {
    return this.usersService.update('demo-user-123', updateData);
  }
} 