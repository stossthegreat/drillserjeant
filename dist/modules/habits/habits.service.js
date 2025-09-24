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
    }
    async list(userId) {
        return this.habits.filter(habit => habit.userId === userId);
    }
    async create(userId, habitData) {
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
    async tick(id, userId) {
        const habit = this.habits.find(h => h.id === id && h.userId === userId);
        if (!habit) {
            throw new Error('Habit not found');
        }
        const today = new Date().toDateString();
        const lastTickDate = habit.lastTick ? new Date(habit.lastTick).toDateString() : null;
        if (lastTickDate === today) {
            return habit;
        }
        habit.lastTick = new Date().toISOString();
        habit.streak = (habit.streak || 0) + 1;
        return habit;
    }
    async update(id, userId, updateData) {
        const habit = this.habits.find(h => h.id === id && h.userId === userId);
        if (!habit) {
            throw new Error('Habit not found');
        }
        Object.assign(habit, updateData);
        return habit;
    }
};
exports.HabitsService = HabitsService;
exports.HabitsService = HabitsService = __decorate([
    (0, common_1.Injectable)()
], HabitsService);
//# sourceMappingURL=habits.service.js.map