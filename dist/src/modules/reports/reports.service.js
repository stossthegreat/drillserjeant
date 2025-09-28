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
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWeeklyReport(userId, weekISO) {
        const now = new Date();
        const end = now;
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const events = await this.prisma.event.findMany({
            where: { userId, ts: { gte: start, lte: end } },
            orderBy: { ts: 'asc' },
        });
        const habits = await this.prisma.habit.findMany({ where: { userId } });
        const total = habits.length * 7 || 1;
        const successes = events.filter(e => e.type === 'habit_success').length;
        const fails = events.filter(e => e.type === 'habit_fail').length;
        const skips = events.filter(e => e.type === 'habit_skip').length;
        const successRate = Math.round((successes / total) * 100);
        const xp = successes * 10 - fails * 5;
        const rank = xp >= 500 ? 'Gold' : xp >= 200 ? 'Silver' : 'Bronze';
        return {
            week: weekISO || `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`,
            successRate,
            deltas: { vsLastWeek: 0 },
            counts: { successes, fails, skips },
            lifeBank: { gainedMinutes: successes * 25, lostMinutes: fails * 25 },
            rank: { xp, tier: rank },
            focusHabit: habits[0]?.title || 'Focus',
            heatmap: this.buildHeatmap(events),
            commentary: `Solid work. Success rate ${successRate}%—focus on consistent reps.`,
        };
    }
    buildHeatmap(events) {
        const map = {};
        for (const e of events) {
            const day = new Date(e.ts).toISOString().slice(0, 10);
            map[day] = (map[day] || 0) + (e.type === 'habit_success' ? 1 : 0);
        }
        return map;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map