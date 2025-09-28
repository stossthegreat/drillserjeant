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
        const habits = await this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
        return {
            date: start.toISOString().slice(0, 10),
            habits,
            tasks: [],
            nudge: nudge?.payload || null,
        };
    }
};
exports.BriefService = BriefService;
exports.BriefService = BriefService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mentors_service_1.MentorsService,
        queues_service_1.QueuesService])
], BriefService);
//# sourceMappingURL=brief.service.js.map