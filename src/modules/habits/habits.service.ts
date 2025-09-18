import { Injectable } from '@nestjs/common';

@Injectable()
export class HabitsService {
  private habits = [
    {
      id: 'habit-1',
      userId: 'demo-user-123',
      title: 'Morning Workout',
      schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      streak: 5,
      lastTick: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'habit-2', 
      userId: 'demo-user-123',
      title: 'Read 30 Minutes',
      schedule: { time: '20:00', days: ['daily'] },
      streak: 12,
      lastTick: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  async list(userId: string) {
    return this.habits.filter(h => h.userId === userId);
  }

  async create(userId: string, data: any) {
    const habit = {
      id: `habit-${Date.now()}`,
      userId,
      ...data,
      streak: 0,
      lastTick: null,
      createdAt: new Date().toISOString(),
    };
    this.habits.push(habit);
    return habit;
  }

  async update(id: string, data: any) {
    const index = this.habits.findIndex(h => h.id === id);
    if (index >= 0) {
      this.habits[index] = { ...this.habits[index], ...data };
      return this.habits[index];
    }
    throw new Error('Habit not found');
  }

  async tick(userId: string, habitId: string, idempotencyKey?: string) {
    console.log(`Ticking habit ${habitId} for user ${userId} (key: ${idempotencyKey})`);
    
    const habit = this.habits.find(h => h.id === habitId && h.userId === userId);
    if (!habit) {
      throw new Error('Habit not found');
    }

    // Simple idempotency check - in production this would use Redis
    const today = new Date().toISOString().split('T')[0];
    if (habit.lastTick?.startsWith(today)) {
      console.log('Habit already ticked today - idempotent response');
      return { achievements: [] };
    }

    habit.streak += 1;
    habit.lastTick = new Date().toISOString();
    
    // Create event (mock for now - will integrate with real event system)
    console.log(`📝 Event created: habit_tick for ${habitId}`);
    
    // Check for achievements (will integrate with StreaksService)
    const achievements = this.checkAchievements(userId, habitId, habit.streak);
    
    console.log(`Habit ticked! New streak: ${habit.streak}, Achievements: ${achievements.length}`);
    
    return { achievements };
  }

  private checkAchievements(userId: string, habitId: string, streak: number) {
    // Mock achievement checking - will integrate with StreaksService
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const achievements = [];
    
    if (milestones.includes(streak)) {
      achievements.push({
        id: `streak_${streak}`,
        title: `${streak} Day Streak!`,
        description: `Completed ${streak} days in a row`,
        unlocked: true,
        audioPresetId: `praise_${streak}_day`
      });
      console.log(`🎉 ACHIEVEMENT: ${streak} day streak unlocked!`);
    }
    
    return achievements;
  }
} 