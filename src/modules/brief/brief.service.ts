import { Injectable } from '@nestjs/common';
import { HabitsService } from '../habits/habits.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class BriefService {
  constructor(
    private readonly habitsService: HabitsService,
    private readonly tasksService: TasksService,
  ) {}

  async getTodaysBrief(userId: string) {
    const habits = await this.habitsService.list(userId);
    const tasks = await this.tasksService.list(userId);
    
    // Mock user and mission data
    const user = { 
      rank: 'Sergeant', 
      xp: 1200,
      streakDays: 7
    };
    
    const missions = [
      { 
        id: 'm1', 
        title: 'Complete 3 habits', 
        progress: habits.filter(h => this.isCompletedToday(h)).length, 
        target: Math.min(habits.length, 3)
      }
    ];
    
    const achievements = [
      { id: 'a1', name: '7-Day Streak' }
    ];
    
    const targets = {
      habitsCompleted: habits.filter(h => this.isCompletedToday(h)).length,
      tasksCompleted: tasks.filter(t => t.completed).length,
      streakDays: 7
    };
    
    // Build today items combining habits and tasks
    const today = [
      ...habits.map(h => ({...h, type: 'habit'})),
      ...tasks.map(t => ({...t, type: 'task'}))
    ];
    
    return {
      user,
      missions,
      achievements,
      targets,
      habits,
      tasks,
      today
    };
  }

  private isCompletedToday(habit: any): boolean {
    if (!habit.lastTick) return false;
    const today = new Date().toDateString();
    return new Date(habit.lastTick).toDateString() === today;
  }
} 