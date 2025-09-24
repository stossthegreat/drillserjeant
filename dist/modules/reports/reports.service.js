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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const habits_service_1 = require("../habits/habits.service");
const tasks_service_1 = require("../tasks/tasks.service");
let ReportsService = class ReportsService {
    constructor(habitsService, tasksService) {
        this.habitsService = habitsService;
        this.tasksService = tasksService;
    }
    async generateMorningBrief(userId) {
        const habits = await this.habitsService.list(userId);
        const tasks = await this.tasksService.list(userId);
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayCompletions = habits.filter(h => {
            if (!h.lastTick)
                return false;
            const tickDate = new Date(h.lastTick).toDateString();
            return tickDate === yesterday.toDateString();
        }).length;
        const todayHabits = habits.filter(h => {
            return !h.schedule?.days || h.schedule.days.includes('daily') ||
                h.schedule.days.includes(dayName.toLowerCase().substring(0, 3));
        });
        const pendingTasks = tasks.filter(t => !t.completed);
        const insights = this.generateMorningInsights(habits, tasks, yesterdayCompletions);
        return {
            type: 'morning_brief',
            date: today.toISOString().split('T')[0],
            dayName,
            yesterday: {
                habitsCompleted: yesterdayCompletions,
                performance: yesterdayCompletions >= todayHabits.length * 0.7 ? 'excellent' :
                    yesterdayCompletions >= todayHabits.length * 0.5 ? 'good' : 'needs_improvement'
            },
            today: {
                targetHabits: todayHabits.length,
                priorityTasks: pendingTasks.slice(0, 3),
                weatherAlert: this.getWeatherAlert(),
                focusArea: this.identifyFocusArea(habits, tasks)
            },
            insights,
            motivation: this.generateMorningMotivation(insights.momentum),
            timestamp: new Date().toISOString()
        };
    }
    async generateEveningSummary(userId) {
        const habits = await this.habitsService.list(userId);
        const tasks = await this.tasksService.list(userId);
        const today = new Date();
        const todayString = today.toDateString();
        const todayHabitCompletions = habits.filter(h => {
            if (!h.lastTick)
                return false;
            return new Date(h.lastTick).toDateString() === todayString;
        });
        const todayTaskCompletions = tasks.filter(t => t.completed && t.completedAt &&
            new Date(t.completedAt).toDateString() === todayString);
        const habitScore = habits.length > 0 ? (todayHabitCompletions.length / habits.length) * 100 : 0;
        const taskScore = tasks.length > 0 ? (todayTaskCompletions.length / tasks.length) * 100 : 0;
        const overallScore = Math.round((habitScore + taskScore) / 2);
        const insights = this.generateEveningInsights(todayHabitCompletions, todayTaskCompletions, habits);
        return {
            type: 'evening_summary',
            date: today.toISOString().split('T')[0],
            performance: {
                habitsCompleted: todayHabitCompletions.length,
                tasksCompleted: todayTaskCompletions.length,
                habitScore: Math.round(habitScore),
                taskScore: Math.round(taskScore),
                overallScore,
                grade: this.calculateGrade(overallScore)
            },
            achievements: this.identifyDailyAchievements(todayHabitCompletions, todayTaskCompletions),
            improvements: this.identifyImprovements(habits, tasks, todayHabitCompletions),
            tomorrow: {
                recommendations: this.generateTomorrowRecommendations(insights),
                riskAlerts: this.identifyTomorrowRisks(habits)
            },
            insights,
            reflection: this.generateEveningReflection(overallScore, insights),
            timestamp: new Date().toISOString()
        };
    }
    async generateDailyReport(userId, date) {
        const targetDate = date ? new Date(date) : new Date();
        const habits = await this.habitsService.list(userId);
        const tasks = await this.tasksService.list(userId);
        return {
            type: 'daily_report',
            date: targetDate.toISOString().split('T')[0],
            summary: 'Detailed daily analysis coming soon...',
            habits: habits.length,
            tasks: tasks.length,
            timestamp: new Date().toISOString()
        };
    }
    async generateWeeklyReport(userId, week) {
        const habits = await this.habitsService.list(userId);
        const tasks = await this.tasksService.list(userId);
        const totalHabits = habits.length;
        const activeStreaks = habits.filter(h => h.streak > 0).length;
        const longestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
        return {
            type: 'weekly_report',
            week: week || this.getCurrentWeek(),
            overview: {
                totalHabits,
                activeStreaks,
                longestStreak,
                weeklyConsistency: activeStreaks > 0 ? (activeStreaks / totalHabits) * 100 : 0
            },
            patterns: {
                strongDays: ['Monday', 'Tuesday'],
                weakDays: ['Saturday', 'Sunday'],
                peakTime: '08:00 AM',
                insights: [
                    'You perform best in the morning',
                    'Weekend consistency needs improvement',
                    'Streak momentum is building well'
                ]
            },
            recommendations: [
                'Focus on weekend habit maintenance',
                'Consider morning habit stacking',
                'Celebrate your streak achievements'
            ],
            timestamp: new Date().toISOString()
        };
    }
    generateMorningInsights(habits, tasks, yesterdayCompletions) {
        const insights = {
            momentum: yesterdayCompletions > habits.length * 0.7 ? 'high' :
                yesterdayCompletions > habits.length * 0.3 ? 'medium' : 'low',
            streakStatus: this.analyzeStreakStatus(habits),
            riskFactors: this.identifyRiskFactors(habits),
            opportunities: this.identifyOpportunities(habits, tasks)
        };
        return insights;
    }
    generateEveningInsights(habitCompletions, taskCompletions, allHabits) {
        return {
            momentum: habitCompletions.length > allHabits.length * 0.7 ? 'high' :
                habitCompletions.length > allHabits.length * 0.3 ? 'medium' : 'low',
            consistency: this.calculateConsistency(habitCompletions, allHabits),
            productivityPattern: taskCompletions.length > 2 ? 'high' : taskCompletions.length > 0 ? 'medium' : 'low'
        };
    }
    generateMorningMotivation(momentum) {
        const motivations = {
            high: [
                "Yesterday's excellence sets today's standard. Let's raise the bar even higher!",
                "Momentum is on your side! Channel that energy into today's victories.",
                "You're in the zone! This is how champions maintain their edge."
            ],
            medium: [
                "Steady progress builds lasting success. Today is your canvas.",
                "Good foundation yesterday. Let's build something remarkable today.",
                "Consistency beats perfection. Show up and make it count."
            ],
            low: [
                "Every champion has comeback days. Today is yours.",
                "Yesterday is data, not destiny. Write a better story today.",
                "Small steps forward beat standing still. Begin now."
            ]
        };
        const messages = motivations[momentum] || motivations.medium;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    generateEveningReflection(score, insights) {
        if (score >= 80) {
            return "Outstanding day! Your commitment to excellence shows in every action.";
        }
        else if (score >= 60) {
            return "Solid progress today. You're building something meaningful.";
        }
        else if (score >= 40) {
            return "Mixed results today, but every effort counts. Tomorrow brings new opportunities.";
        }
        else {
            return "Challenging day, but you showed up. That's the foundation of all progress.";
        }
    }
    analyzeStreakStatus(habits) {
        const activeStreaks = habits.filter(h => h.streak > 0).length;
        const totalHabits = habits.length;
        if (activeStreaks === totalHabits && totalHabits > 0)
            return 'all_strong';
        if (activeStreaks > totalHabits * 0.7)
            return 'mostly_strong';
        if (activeStreaks > totalHabits * 0.3)
            return 'mixed';
        return 'needs_attention';
    }
    identifyRiskFactors(habits) {
        const risks = [];
        const now = new Date();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        if (isWeekend)
            risks.push('weekend_challenge');
        const overdueHabits = habits.filter(h => {
            if (!h.lastTick)
                return true;
            const daysSince = (Date.now() - new Date(h.lastTick).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 1;
        });
        if (overdueHabits.length > 0)
            risks.push('overdue_habits');
        return risks;
    }
    identifyOpportunities(habits, tasks) {
        const opportunities = [];
        if (habits.some(h => h.streak > 7)) {
            opportunities.push('streak_momentum');
        }
        if (tasks.filter(t => !t.completed).length <= 3) {
            opportunities.push('manageable_workload');
        }
        return opportunities;
    }
    identifyDailyAchievements(habitCompletions, taskCompletions) {
        const achievements = [];
        if (habitCompletions.length >= 3) {
            achievements.push('Habit Hero: Completed 3+ habits today');
        }
        if (taskCompletions.length >= 2) {
            achievements.push('Task Master: Completed multiple tasks');
        }
        const streakHabits = habitCompletions.filter(h => h.streak >= 7);
        if (streakHabits.length > 0) {
            achievements.push(`Streak Champion: ${streakHabits.length} habit${streakHabits.length === 1 ? '' : 's'} with 7+ day streaks`);
        }
        return achievements;
    }
    identifyImprovements(allHabits, allTasks, completedHabits) {
        const improvements = [];
        const missedHabits = allHabits.length - completedHabits.length;
        if (missedHabits > 0) {
            improvements.push(`Focus on ${missedHabits} remaining habit${missedHabits === 1 ? '' : 's'}`);
        }
        const incompleteTasks = allTasks.filter(t => !t.completed).length;
        if (incompleteTasks > 3) {
            improvements.push('Consider prioritizing your task list');
        }
        return improvements;
    }
    generateTomorrowRecommendations(insights) {
        const recommendations = [];
        if (insights.momentum === 'high') {
            recommendations.push('Capitalize on momentum with a challenging goal');
        }
        else if (insights.momentum === 'low') {
            recommendations.push('Start with your easiest habit to build momentum');
        }
        return recommendations;
    }
    identifyTomorrowRisks(habits) {
        const risks = [];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const isWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
        if (isWeekend) {
            risks.push('Weekend consistency challenge');
        }
        return risks;
    }
    calculateGrade(score) {
        if (score >= 90)
            return 'A+';
        if (score >= 80)
            return 'A';
        if (score >= 70)
            return 'B';
        if (score >= 60)
            return 'C';
        return 'D';
    }
    calculateConsistency(completions, total) {
        return total.length > 0 ? Math.round((completions.length / total.length) * 100) : 0;
    }
    getWeatherAlert() {
        return "Clear skies ahead for your goals today!";
    }
    identifyFocusArea(habits, tasks) {
        const overdueHabits = habits.filter(h => {
            if (!h.lastTick)
                return true;
            const daysSince = (Date.now() - new Date(h.lastTick).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 1;
        });
        if (overdueHabits.length > 0) {
            return `Habit Recovery: Focus on ${overdueHabits[0].title}`;
        }
        const urgentTasks = tasks.filter(t => !t.completed).slice(0, 1);
        if (urgentTasks.length > 0) {
            return `Task Priority: ${urgentTasks[0].title}`;
        }
        return 'Momentum Building: Maintain your excellent progress';
    }
    getCurrentWeek() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [habits_service_1.HabitsService,
        tasks_service_1.TasksService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map