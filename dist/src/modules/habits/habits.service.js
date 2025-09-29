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
exports.HabitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");

function normalizeSchedule(body) {
    const frequency = (body.frequency || body.type || body.kind || 'daily').toString();
    const startDate = body.startDate || body.from;
    const endDate = body.endDate || body.to;
    const days = Array.isArray(body.days) ? body.days : undefined;
    const everyN = Number(body.everyN || body.n || 0) || undefined;

    const schedule = {};
    if (startDate) schedule.from = startDate;
    if (endDate) schedule.to = endDate;

    switch (frequency) {
        case 'alldays':
        case 'all':
        case 'daily':
            schedule.kind = 'alldays';
            break;
        case 'weekdays':
            schedule.kind = 'weekdays';
            break;
        case 'custom':
            schedule.kind = 'custom';
            schedule.days = (days || []).map((d) => Number(d)).filter((n) => n >= 1 && n <= 7);
            break;
        case 'everyN':
            schedule.kind = 'everyN';
            if (everyN && everyN > 0) schedule.n = everyN;
            break;
        default:
            schedule.kind = frequency;
            break;
    }

    if (typeof body.reminderEnabled !== 'undefined') schedule.reminderEnabled = !!body.reminderEnabled;
    if (body.reminderTime) schedule.reminderTime = body.reminderTime;

    return schedule;
}

let HabitsService = class HabitsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    
    async list(userId) {
        return this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    }

    async create(userId, body) {
        const title = (body.title || body.name || '').toString().trim();
        if (!title) {
            throw new Error('title is required');
        }

        const scheduleInput = body.schedule || normalizeSchedule(body);

        const created = await this.prisma.habit.create({
            data: {
                userId,
                title,
                schedule: scheduleInput,
            },
        });
        return created;
    }

    async tick(userId, habitId) {
        const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
        if (!habit || habit.userId !== userId) {
            throw new Error('Habit not found');
        }

        const now = new Date();
        const last = habit.lastTick ? new Date(habit.lastTick) : null;
        const alreadyToday = !!last &&
            last.getFullYear() === now.getFullYear() &&
            last.getMonth() === now.getMonth() &&
            last.getDate() === now.getDate();

        if (alreadyToday) {
            return { ok: true, idempotent: true, streak: habit.streak, timestamp: habit.lastTick };
        }

        const updated = await this.prisma.habit.update({
            where: { id: habitId },
            data: { lastTick: now, streak: { increment: 1 } },
        });

        await this.prisma.event.create({ data: { userId, type: 'habit_success', payload: { habitId } } });
        return { ok: true, idempotent: false, streak: updated.streak, timestamp: updated.lastTick };
    }

    async delete(userId, habitId) {
        const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
        if (!habit || habit.userId !== userId) {
            throw new Error('Habit not found');
        }
        await this.prisma.habit.delete({ where: { id: habitId } });
        await this.prisma.event.create({ data: { userId, type: 'habit_deleted', payload: { habitId } } });
        return { ok: true };
    }
};
exports.HabitsService = HabitsService;
exports.HabitsService = HabitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HabitsService);