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
const tasks_service_1 = require("../tasks/tasks.service");
let BriefService = class BriefService {
    constructor(habitsService, tasksService) {
        this.habitsService = habitsService;
        this.tasksService = tasksService;
    }
    async getTodaysBrief(userId) {
        const habits = await this.habitsService.list(userId);
        const tasks = await this.tasksService.list(userId);
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
        const today = [
            ...habits.map(h => ({ ...h, type: 'habit' })),
            ...tasks.map(t => ({ ...t, type: 'task' }))
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
    isCompletedToday(habit) {
        if (!habit.lastTick)
            return false;
        const today = new Date().toDateString();
        return new Date(habit.lastTick).toDateString() === today;
    }
};
exports.BriefService = BriefService;
exports.BriefService = BriefService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [habits_service_1.HabitsService,
        tasks_service_1.TasksService])
], BriefService);
//# sourceMappingURL=brief.service.js.map