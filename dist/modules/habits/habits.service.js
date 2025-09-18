"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsService = void 0;
const common_1 = require("@nestjs/common");
let HabitsService = class HabitsService {
    constructor() {
        this.habits = [
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
    }
    async list(userId) {
        return this.habits.filter(h => h.userId === userId);
    }
    async create(userId, data) {
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
    async update(id, data) {
        const index = this.habits.findIndex(h => h.id === id);
        if (index >= 0) {
            this.habits[index] = { ...this.habits[index], ...data };
            return this.habits[index];
        }
        throw new Error('Habit not found');
    }
    async tick(userId, habitId, idempotencyKey) {
        console.log(`Ticking habit ${habitId} for user ${userId} (key: ${idempotencyKey})`);
        const habit = this.habits.find(h => h.id === habitId && h.userId === userId);
        if (!habit) {
            throw new Error('Habit not found');
        }
        const today = new Date().toISOString().split('T')[0];
        if (habit.lastTick?.startsWith(today)) {
            console.log('Habit already ticked today - idempotent response');
            return { achievements: [] };
        }
        habit.streak += 1;
        habit.lastTick = new Date().toISOString();
        console.log(`📝 Event created: habit_tick for ${habitId}`);
        const achievements = this.checkAchievements(userId, habitId, habit.streak);
        console.log(`Habit ticked! New streak: ${habit.streak}, Achievements: ${achievements.length}`);
        return { achievements };
    }
    checkAchievements(userId, habitId, streak) {
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
};
exports.HabitsService = HabitsService;
exports.HabitsService = HabitsService = __decorate([
    (0, common_1.Injectable)()
], HabitsService);
//# sourceMappingURL=habits.service.js.map