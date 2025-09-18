import { Injectable } from '@nestjs/common';

interface Achievement {
  id: string;
  title: string;
  description: string;
  threshold: number;
  type: string;
  rarity: string;
  xp: number;
  audioPresetId: string;
}

@Injectable()
export class StreaksService {
  private achievements: Record<string, Achievement> = {
    first_week: {
      id: 'first_week',
      title: '🔥 First Week',
      description: 'Complete 7 days in a row',
      threshold: 7,
      type: 'streak',
      rarity: 'common',
      xp: 100,
      audioPresetId: 'praise_week'
    },
    two_weeks: {
      id: 'two_weeks',
      title: '⚡ Momentum Builder',
      description: '14 days of consistency',
      threshold: 14,
      type: 'streak',
      rarity: 'common',
      xp: 200,
      audioPresetId: 'praise_fortnight'
    },
    one_month: {
      id: 'one_month',
      title: '💪 Iron Will',
      description: '30 days of dedication',
      threshold: 30,
      type: 'streak',
      rarity: 'uncommon',
      xp: 500,
      audioPresetId: 'praise_month'
    },
    two_months: {
      id: 'two_months',
      title: '🏆 Habit Master',
      description: '60 days of excellence',
      threshold: 60,
      type: 'streak',
      rarity: 'rare',
      xp: 1000,
      audioPresetId: 'praise_master'
    },
    three_months: {
      id: 'three_months',
      title: '👑 Discipline King',
      description: '90 days of unwavering commitment',
      threshold: 90,
      type: 'streak',
      rarity: 'epic',
      xp: 2000,
      audioPresetId: 'praise_king'
    },
    six_months: {
      id: 'six_months',
      title: '🌟 Legend',
      description: '180 days of legendary consistency',
      threshold: 180,
      type: 'streak',
      rarity: 'legendary',
      xp: 5000,
      audioPresetId: 'praise_legend'
    },
    one_year: {
      id: 'one_year',
      title: '🏅 Immortal',
      description: '365 days of immortal discipline',
      threshold: 365,
      type: 'streak',
      rarity: 'mythic',
      xp: 10000,
      audioPresetId: 'praise_immortal'
    }
  };

  private userAchievements = new Map<string, any[]>();
  private pendingCelebrations = new Map<string, any[]>();

  async checkAchievements(userId: string, habitId: string, currentStreak: number) {
    console.log(`🏆 Checking achievements for user ${userId}, habit ${habitId}, streak ${currentStreak}`);
    
    const userAchievementsList = this.userAchievements.get(userId) || [];
    const newAchievements = [];
    
    // Check streak milestones
    const streakThresholds = [7, 14, 30, 60, 90, 180, 365];
    
    for (const threshold of streakThresholds) {
      if (currentStreak === threshold) {
        const achievementKey = this.getStreakAchievementKey(threshold);
        const achievement = this.achievements[achievementKey];
        
        if (achievement) {
          const existingAchievement = userAchievementsList.find(a => 
            a.achievementId === achievement.id && a.habitId === habitId
          );
          
          if (!existingAchievement) {
            const newAchievement = {
              id: this.generateId(),
              userId,
              habitId,
              achievementId: achievement.id,
              unlockedAt: new Date().toISOString(),
              ...achievement
            };
            
            newAchievements.push(newAchievement);
            userAchievementsList.push(newAchievement);
            
            // Queue celebration
            this.queueCelebration(userId, newAchievement);
            
            console.log(`🎉 ACHIEVEMENT UNLOCKED: ${achievement.title} (${currentStreak} days)`);
          }
        }
      }
    }
    
    // Update user achievements
    this.userAchievements.set(userId, userAchievementsList);
    
    return newAchievements;
  }

  async getUserAchievements(userId: string) {
    const userAchievementsList = this.userAchievements.get(userId) || [];
    const totalXP = userAchievementsList.reduce((sum, a) => sum + a.xp, 0);
    const level = Math.floor(totalXP / 1000) + 1;
    
    return {
      achievements: userAchievementsList,
      totalXP,
      level,
      rank: this.getRankByLevel(level),
      pendingCelebrations: this.pendingCelebrations.get(userId) || []
    };
  }

  async getStreakSummary(userId: string) {
    // TODO: Compute from events; for now provide sensible placeholders
    const overall = 23;
    const categories = [
      { id: 'overall', name: 'Overall', days: overall },
      { id: 'clean', name: 'Clean Days', days: 12 },
      { id: 'morning', name: 'Morning Momentum', days: 9 },
      { id: 'deep_work', name: 'Deep Work', days: 6 },
      { id: 'two_plus', name: 'Two‑plus Reps', days: 8 },
      { id: 'perfect', name: 'Perfect Day', days: 2 },
      { id: 'alarm', name: 'Alarm Discipline', days: 5 },
      { id: 'commit', name: 'Commit Cadence', days: 7 },
    ];

    // In a real impl, filter out categories with 0 days or not relevant to the user
    return {
      overall,
      categories,
    };
  }

  private getStreakAchievementKey(threshold: number): string {
    const mapping: Record<number, string> = {
      7: 'first_week',
      14: 'two_weeks',
      30: 'one_month',
      60: 'two_months',
      90: 'three_months',
      180: 'six_months',
      365: 'one_year'
    };
    return mapping[threshold];
  }

  private getRankByLevel(level: number): string {
    if (level >= 10) return 'General';
    if (level >= 7) return 'Colonel';
    if (level >= 5) return 'Major';
    if (level >= 3) return 'Captain';
    if (level >= 2) return 'Lieutenant';
    return 'Sergeant';
  }

  private queueCelebration(userId: string, achievement: any) {
    const celebrations = this.pendingCelebrations.get(userId) || [];
    celebrations.push({
      type: 'achievement_unlock',
      achievement,
      timestamp: new Date().toISOString()
    });
    this.pendingCelebrations.set(userId, celebrations);
  }

  private generateId(): string {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 