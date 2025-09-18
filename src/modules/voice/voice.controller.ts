import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Voice')
@Controller('v1/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get('preset/:id')
  @ApiOperation({ summary: 'Get preset audio URL' })
  @ApiResponse({ status: 200, description: 'Signed URL for preset audio' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getPreset(@Req() req: any, @Param('id') id: string) {
    return this.voiceService.getPreset(id);
  }

  @Post('tts')
  @ApiOperation({ summary: 'Convert text to speech (PRO only)' })
  @ApiResponse({ status: 200, description: 'Generated audio URL' })
  @ApiResponse({ status: 403, description: 'Upgrade required' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async textToSpeech(@Req() req: any, @Body() body: { text: string; voice?: string }) {
    const userId = req.user?.id;
    return this.voiceService.synthesize(userId, body.text, body.voice);
  }
} 