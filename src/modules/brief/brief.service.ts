import { Injectable } from '@nestjs/common';
import { HabitsService } from '../habits/habits.service';
import { StreaksService } from '../streaks/streaks.service';

@Injectable()
export class BriefService {
  constructor(
    private habitsService: HabitsService,
    private streaksService: StreaksService
  ) {}

  async getTodaysBrief(userId: string) {
    const [habits, achievements, streakSummary] = await Promise.all([
      this.habitsService.list(userId),
      this.streaksService.getUserAchievements(userId),
      this.streaksService.getStreakSummary(userId)
    ]);

    const now = new Date();
    const today = now.toDateString();

    // Today's missions from habits
    const missions = habits.slice(0, 3).map(habit => {
      const tickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
      const nextMilestone = this.getNextMilestone(habit.streak);
      
      return {
        id: habit.id,
        title: habit.title,
        streak: habit.streak,
        status: tickedToday ? 'completed' : 'pending',
        due: 'today',
        nextMilestone,
        daysToMilestone: nextMilestone ? nextMilestone - habit.streak : null
      };
    });

    // Risk banners for habits at risk
    const riskBanners = habits
      .filter(habit => {
        const daysSinceLastTick = habit.lastTick ? 
          Math.floor((now.getTime() - new Date(habit.lastTick).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        return daysSinceLastTick > 1 && habit.streak > 7; // At risk if not ticked for 1+ days and has a streak
      })
      .map(habit => ({
        type: 'streak_save',
        habitId: habit.id,
        message: `${habit.title} streak at risk! Don't break the chain.`,
        urgency: 'high'
      }));

    return {
      user: {
        rank: achievements.rank,
        xp: achievements.totalXP,
        level: achievements.level
      },
      missions,
      riskBanners,
      weeklyTarget: {
        current: this.calculateWeeklyProgress(habits),
        goal: 6.0
      },
      achievements: achievements.achievements.slice(-3), // Latest 3 achievements
      streaksSummary: streakSummary,
      pendingCelebrations: achievements.pendingCelebrations,
      nudges: this.generateNudges(habits, riskBanners.length > 0)
    };
  }

  private getNextMilestone(currentStreak: number): number | null {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    return milestones.find(m => m > currentStreak) || null;
  }

  private calculateWeeklyProgress(habits: any[]): number {
    // Mock calculation - in real implementation, would check last 7 days of ticks
    const completedToday = habits.filter(h => {
      const today = new Date().toDateString();
      return h.lastTick && new Date(h.lastTick).toDateString() === today;
    }).length;
    
    return Math.min(completedToday * 1.5, 6.0); // Mock weekly progress
  }

  private generateNudges(habits: any[], hasRisks: boolean): any[] {
    const nudges = [];
    
    if (hasRisks) {
      nudges.push({
        type: 'streak_save',
        title: 'Save Your Streak',
        message: 'Don\'t let your progress slip away. Complete your habits now.',
        priority: 'high'
      });
    }

    const uncompletedHabits = habits.filter(h => {
      const today = new Date().toDateString();
      return !h.lastTick || new Date(h.lastTick).toDateString() !== today;
    });

    if (uncompletedHabits.length > 0) {
      nudges.push({
        type: 'daily_reminder',
        title: 'Complete Your Mission',
        message: `${uncompletedHabits.length} habits remaining for today.`,
        priority: 'medium'
      });
    }

    return nudges;
  }
} 