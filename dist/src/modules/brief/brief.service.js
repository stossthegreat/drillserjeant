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
const prisma_service_1 = require("../prisma/prisma.service");
const mentors_service_1 = require("../mentors/mentors.service");
const queues_service_1 = require("../queues/queues.service");
let BriefService = class BriefService {
    constructor(prisma, mentors, queues) {
        this.prisma = prisma;
        this.mentors = mentors;
        this.queues = queues;
    }
    async getToday(userId) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        const events = await this.prisma.event.findMany({
            where: { userId, ts: { gte: start, lte: end } },
            orderBy: { ts: 'desc' },
            take: 100,
        });
        const latestNudge = events.find(e => e.type.startsWith('mentor_')) || null;
        let nudge = latestNudge;
        if (!nudge) {
            const gen = await this.mentors.generateMentorLine(userId, 'primer');
            nudge = await this.prisma.event.create({
                data: { userId, type: 'mentor_primer', payload: gen },
            });
            await this.queues.enqueueNotification({ userId, text: gen.text, voiceUrl: gen.voiceUrl, kind: 'primer', mentor: gen.mentor });
        }
        let habits = await this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
        habits = habits.filter(h => this.isScheduledToday(h.schedule, h.createdAt));
        const enrichedHabits = habits.map(h => {
            const s = typeof h.schedule === 'string' ? safeJsonParse(h.schedule) : (h.schedule || {});
            return {
                ...h,
                reminderEnabled: s.reminderEnabled ?? false,
                reminderTime: s.reminderTime ?? null,
            };
        });
        return {
            date: start.toISOString().slice(0, 10),
            habits: enrichedHabits,
            tasks: [],
            nudge: nudge?.payload || null,
        };
    }
    isScheduledToday(schedule, createdAt) {
        try {
            const s = typeof schedule === 'string' ? JSON.parse(schedule) : (schedule || {});
            const today = new Date();
            const dayIdx = ((today.getDay() + 6) % 7) + 1;
            const from = s.from ? new Date(s.from) : null;
            const to = s.to ? new Date(s.to) : null;
            if (from && today < new Date(from.setHours(0, 0, 0, 0)))
                return false;
            if (to && today > new Date(to.setHours(23, 59, 59, 999)))
                return false;
            const kind = (s.kind || s.type || '').toString();
            if (kind === 'alldays')
                return true;
            if (kind === 'weekdays')
                return dayIdx <= 5;
            if (kind === 'everyN') {
                const n = Number(s.n || s.everyN || 0);
                if (!n || n <= 0)
                    return true;
                const anchor = from ? new Date(from) : (createdAt ? new Date(createdAt) : null);
                if (!anchor)
                    return true;
                const anchorMid = new Date(anchor);
                anchorMid.setHours(0, 0, 0, 0);
                const todayMid = new Date(today);
                todayMid.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((todayMid.getTime() - anchorMid.getTime()) / (1000 * 60 * 60 * 24));
                return diffDays % n === 0 && diffDays >= 0;
            }
            const days = Array.isArray(s.days) ? s.days.map((d) => Number(d)).filter((n) => n >= 1 && n <= 7) : [];
            if (days.length === 0 && !kind)
                return true;
            return days.includes(dayIdx);
        }
        catch {
            return true;
        }
    }
};
exports.BriefService = BriefService;
exports.BriefService = BriefService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mentors_service_1.MentorsService,
        queues_service_1.QueuesService])
], BriefService);
function safeJsonParse(v) {
    try {
        return JSON.parse(v);
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=brief.service.js.map