"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefService = void 0;
const common_1 = require("@nestjs/common");
const habits_service_1 = require("../habits/habits.service");
const streaks_service_1 = require("../streaks/streaks.service");
let BriefService = class BriefService {
    constructor(habitsService, streaksService) {
        this.habitsService = habitsService;
        this.streaksService = streaksService;
    }
    async getTodaysBrief(userId) {
        const [habits, achievements, streakSummary] = await Promise.all([
            this.habitsService.list(userId),
            this.streaksService.getUserAchievements(userId),
            this.streaksService.getStreakSummary(userId)
        ]);
        const now = new Date();
        const today = now.toDateString();
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
        const riskBanners = habits
            .filter(habit => {
            const daysSinceLastTick = habit.lastTick ?
                Math.floor((now.getTime() - new Date(habit.lastTick).getTime()) / (1000 * 60 * 60 * 24)) : 999;
            return daysSinceLastTick > 1 && habit.streak > 7;
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
            achievements: achievements.achievements.slice(-3),
            streaksSummary: streakSummary,
            pendingCelebrations: achievements.pendingCelebrations,
            nudges: this.generateNudges(habits, riskBanners.length > 0)
        };
    }
    getNextMilestone(currentStreak) {
        const milestones = [7, 14, 30, 60, 90, 180, 365];
        return milestones.find(m => m > currentStreak) || null;
    }
    calculateWeeklyProgress(habits) {
        const completedToday = habits.filter(h => {
            const today = new Date().toDateString();
            return h.lastTick && new Date(h.lastTick).toDateString() === today;
        }).length;
        return Math.min(completedToday * 1.5, 6.0);
    }
    generateNudges(habits, hasRisks) {
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
};
exports.BriefService = BriefService;
exports.BriefService = BriefService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [habits_service_1.HabitsService,
        streaks_service_1.StreaksService])
], BriefService);
//# sourceMappingURL=brief.service.js.map