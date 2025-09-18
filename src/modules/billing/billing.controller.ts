import { Controller, Post, Get, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Billing')
@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createCheckoutSession(@Req() req: any) {
    return this.billingService.createCheckoutSession(req.user?.id);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create customer portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createPortalSession(@Req() req: any) {
    return this.billingService.createPortalSession(req.user?.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    return this.billingService.handleWebhook(body, signature);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get user usage and quotas' })
  @ApiResponse({ status: 200, description: 'Usage data retrieved' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getUsage(@Req() req: any) {
    return this.billingService.getUsage(req.user?.id);
  }
} 