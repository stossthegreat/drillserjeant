import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findById(id: string) {
    // Mock implementation - will connect to database later
    return {
      id,
      email: 'demo@drillsergeant.com',
      tone: 'balanced',
      intensity: 2,
      consentRoast: false,
      plan: 'FREE',
    };
  }

  async update(id: string, data: any) {
    // Mock implementation - will connect to database later
    console.log(`Updating user ${id} with:`, data);
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }
} 