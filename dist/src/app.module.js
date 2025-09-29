"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const redis_module_1 = require("./modules/infra/redis.module");
const queues_module_1 = require("./modules/queues/queues.module");
const mentors_module_1 = require("./modules/mentors/mentors.module");
const schedule_module_1 = require("./modules/schedule/schedule.module");
const reports_module_1 = require("./modules/reports/reports.module");
const events_module_1 = require("./modules/events/events.module");
const brief_module_1 = require("./modules/brief/brief.module");
const nudges_module_1 = require("./modules/nudges/nudges.module");
const habits_module_1 = require("./modules/habits/habits.module");
const alarms_module_1 = require("./modules/alarms/alarms.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            queues_module_1.QueuesModule,
            mentors_module_1.MentorsModule,
            schedule_module_1.ScheduleModule,
            reports_module_1.ReportsModule,
            events_module_1.EventsModule,
            brief_module_1.BriefModule,
            nudges_module_1.NudgesModule,
            habits_module_1.HabitsModule,
            alarms_module_1.AlarmsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map