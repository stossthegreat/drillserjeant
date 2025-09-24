import { Injectable } from '@nestjs/common';

@Injectable()
export class HabitsService {
  private habits = [
    { 
      id: 'habit-1', 
      userId: 'demo-user-123', 
      title: 'Morning Workout', 
      streak: 7, 
      schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }, 
      lastTick: new Date().toISOString(),
      context: { difficulty: 2, category: 'fitness', lifeDays: 0.5 },
      color: 'emerald',
      reminderEnabled: true,
      reminderTime: '07:00',
      createdAt: '2024-01-01T00:00:00Z'
    },
    { 
      id: 'habit-2', 
      userId: 'demo-user-123', 
      title: 'Read 30 Minutes', 
      streak: 30, 
      schedule: { time: '20:00', days: ['daily'] }, 
      lastTick: new Date().toISOString(),
      context: { difficulty: 1, category: 'learning', lifeDays: 0.3 },
      color: 'sky',
      reminderEnabled: true,
      reminderTime: '20:00',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  async list(userId: string) {
    return this.habits.filter(habit => habit.userId === userId);
  }

  async create(userId: string, habitData: any) {
    const newHabit = {
      id: `habit-${Date.now()}`,
      userId,
      title: habitData.title || habitData.name,
      streak: 0,
      schedule: habitData.schedule || { type: 'daily' },
      lastTick: null,
      context: habitData.context || { difficulty: 2 },
      color: habitData.color || 'emerald',
      reminderEnabled: habitData.reminderEnabled || false,
      reminderTime: habitData.reminderTime || '08:00',
      createdAt: new Date().toISOString(),
      ...habitData
    };
    
    this.habits.push(newHabit);
    return newHabit;
  }

  async tick(id: string, userId: string) {
    const habit = this.habits.find(h => h.id === id && h.userId === userId);
    if (!habit) {
      throw new Error('Habit not found');
    }
    
    const today = new Date().toDateString();
    const lastTickDate = habit.lastTick ? new Date(habit.lastTick).toDateString() : null;
    
    if (lastTickDate === today) {
      return habit; // Already ticked today
    }
    
    habit.lastTick = new Date().toISOString();
    habit.streak = (habit.streak || 0) + 1;
    
    return habit;
  }

  async update(id: string, userId: string, updateData: any) {
    const habit = this.habits.find(h => h.id === id && h.userId === userId);
    if (!habit) {
      throw new Error('Habit not found');
    }
    
    Object.assign(habit, updateData);
    return habit;
  }
} 