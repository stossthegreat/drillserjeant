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
var ScheduleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const queues_service_1 = require("../queues/queues.service");
const mentors_service_1 = require("../mentors/mentors.service");
let ScheduleService = ScheduleService_1 = class ScheduleService {
    constructor(prisma, queues, mentors) {
        this.prisma = prisma;
        this.queues = queues;
        this.mentors = mentors;
        this.logger = new common_1.Logger(ScheduleService_1.name);
    }
    async morningPrimer() {
        await this.generateAndStoreLine('primer');
    }
    async middayScan() {
        await this.generateAndStoreLine('midday_scan');
    }
    async eveningReflection() {
        await this.generateAndStoreLine('evening_reflection');
    }
    async weeklyReport() {
        await this.queues.enqueueWeeklyReport('demo-user-123');
    }
    async randomInterruption() {
        await this.generateAndStoreLine('random_interrupt');
    }
    async generateAndStoreLine(kind) {
        const userId = 'demo-user-123';
        const { text, voice, voiceUrl, mentor } = await this.mentors.generateMentorLine(userId, kind);
        await this.prisma.event.create({
            data: {
                userId,
                type: `mentor_${kind}`,
                payload: { text, voice, voiceUrl, mentor },
            },
        });
        await this.queues.enqueueNotification({ userId, text, voiceUrl, kind, mentor });
        this.logger.log(`Generated ${kind}: ${mentor} -> ${text}`);
    }
};
exports.ScheduleService = ScheduleService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_6AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleService.prototype, "morningPrimer", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_NOON),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleService.prototype, "middayScan", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8PM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleService.prototype, "eveningReflection", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_SUNDAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleService.prototype, "weeklyReport", null);
__decorate([
    (0, schedule_1.Cron)('0 0 15 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleService.prototype, "randomInterruption", null);
exports.ScheduleService = ScheduleService = ScheduleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queues_service_1.QueuesService,
        mentors_service_1.MentorsService])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map