"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlarmsService = void 0;
const common_1 = require("@nestjs/common");
let AlarmsService = class AlarmsService {
    constructor() {
        this.alarms = [
            {
                id: 'alarm-1',
                userId: 'demo-user-123',
                label: 'Morning Workout',
                rrule: 'FREQ=DAILY;BYHOUR=7;BYMINUTE=0',
                tone: 'balanced',
                enabled: true,
                nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                createdAt: '2024-01-01T00:00:00Z',
            },
        ];
    }
    async list(userId) {
        return this.alarms.filter(a => a.userId === userId);
    }
    async create(userId, data) {
        const alarm = {
            id: `alarm-${Date.now()}`,
            userId,
            ...data,
            enabled: true,
            nextRun: this.calculateNextRun(data.rrule),
            createdAt: new Date().toISOString(),
        };
        this.alarms.push(alarm);
        return alarm;
    }
    async update(id, data) {
        const index = this.alarms.findIndex(a => a.id === id);
        if (index >= 0) {
            this.alarms[index] = {
                ...this.alarms[index],
                ...data,
                nextRun: data.rrule ? this.calculateNextRun(data.rrule) : this.alarms[index].nextRun
            };
            return this.alarms[index];
        }
        throw new Error('Alarm not found');
    }
    async delete(id) {
        const index = this.alarms.findIndex(a => a.id === id);
        if (index >= 0) {
            this.alarms.splice(index, 1);
            return { deleted: true };
        }
        throw new Error('Alarm not found');
    }
    calculateNextRun(rrule) {
        console.log(`Calculating next run for RRULE: ${rrule}`);
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
};
exports.AlarmsService = AlarmsService;
exports.AlarmsService = AlarmsService = __decorate([
    (0, common_1.Injectable)()
], AlarmsService);
//# sourceMappingURL=alarms.service.js.map