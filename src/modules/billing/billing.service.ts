import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BillingService {
  private userUsage = new Map<string, any>();
  private userPlans = new Map<string, string>();

  constructor() {
    // Initialize with demo user
    this.userPlans.set('demo-user-123', 'FREE');
    this.userUsage.set('demo-user-123', {
      chatCallsToday: 5,
      ttsCharsToday: 150,
      chatCallsThisMonth: 45,
      ttsCharsThisMonth: 2100
    });
  }

  async createCheckoutSession(userId: string) {
    // Mock Stripe checkout session - will integrate real Stripe later
    console.log(`Creating checkout session for user ${userId}`);
    
    return {
      sessionId: 'cs_mock_' + Date.now(),
      url: 'https://checkout.stripe.com/pay/mock_session',
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    };
  }

  async createPortalSession(userId: string) {
    // Mock Stripe customer portal - will integrate real Stripe later
    console.log(`Creating portal session for user ${userId}`);
    
    const userPlan = this.userPlans.get(userId) || 'FREE';
    if (userPlan === 'FREE') {
      throw new ForbiddenException('Customer portal requires active subscription');
    }

    return {
      url: 'https://billing.stripe.com/p/login/mock_portal',
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };
  }

  async handleWebhook(body: any, signature: string) {
    // Mock webhook processing - will integrate real Stripe later
    console.log('Processing Stripe webhook:', body?.type || 'unknown');
    
    // Simulate subscription events
    if (body.type === 'customer.subscription.created' || body.type === 'invoice.payment_succeeded') {
      const userId = body.data?.object?.metadata?.userId || 'demo-user-123';
      this.userPlans.set(userId, 'PRO');
      console.log(`✅ User ${userId} upgraded to PRO`);
    } else if (body.type === 'customer.subscription.deleted') {
      const userId = body.data?.object?.metadata?.userId || 'demo-user-123';
      this.userPlans.set(userId, 'FREE');
      console.log(`❌ User ${userId} downgraded to FREE`);
    }

    return { received: true };
  }

  async getUsage(userId: string) {
    const usage = this.userUsage.get(userId) || {
      chatCallsToday: 0,
      ttsCharsToday: 0,
      chatCallsThisMonth: 0,
      ttsCharsThisMonth: 0
    };

    const plan = this.userPlans.get(userId) || 'FREE';
    const limits = this.getPlanLimits(plan);

    return {
      plan,
      usage,
      limits,
      remaining: {
        chatCalls: Math.max(0, limits.chatCallsPerDay - usage.chatCallsToday),
        ttsChars: Math.max(0, limits.ttsCharsPerDay - usage.ttsCharsToday)
      },
      features: {
        canUseDynamicTts: plan === 'PRO',
        canUseAdvancedChat: plan === 'PRO',
        maxHabits: limits.maxHabits,
        maxAlarms: limits.maxAlarms
      }
    };
  }

  async checkQuota(userId: string, quotaType: 'chat' | 'tts', amount: number = 1): Promise<boolean> {
    const usage = this.userUsage.get(userId) || { chatCallsToday: 0, ttsCharsToday: 0 };
    const plan = this.userPlans.get(userId) || 'FREE';
    const limits = this.getPlanLimits(plan);

    if (quotaType === 'chat') {
      return usage.chatCallsToday < limits.chatCallsPerDay;
    } else if (quotaType === 'tts') {
      return (usage.ttsCharsToday + amount) <= limits.ttsCharsPerDay;
    }

    return false;
  }

  async incrementUsage(userId: string, quotaType: 'chat' | 'tts', amount: number = 1) {
    const usage = this.userUsage.get(userId) || {
      chatCallsToday: 0,
      ttsCharsToday: 0,
      chatCallsThisMonth: 0,
      ttsCharsThisMonth: 0
    };

    if (quotaType === 'chat') {
      usage.chatCallsToday += amount;
      usage.chatCallsThisMonth += amount;
    } else if (quotaType === 'tts') {
      usage.ttsCharsToday += amount;
      usage.ttsCharsThisMonth += amount;
    }

    this.userUsage.set(userId, usage);
    console.log(`📊 Usage updated for ${userId}: ${quotaType} +${amount}`);
  }

  getUserPlan(userId: string): string {
    return this.userPlans.get(userId) || 'FREE';
  }

  private getPlanLimits(plan: string) {
    const limits = {
      FREE: {
        chatCallsPerDay: 20,
        ttsCharsPerDay: 500,
        maxHabits: 5,
        maxAlarms: 3,
        maxAntiHabits: 2
      },
      PRO: {
        chatCallsPerDay: 200,
        ttsCharsPerDay: 10000,
        maxHabits: 50,
        maxAlarms: 20,
        maxAntiHabits: 10
      }
    };

    return limits[plan] || limits.FREE;
  }
} 