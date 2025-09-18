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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const habits_service_1 = require("./habits.service");
let HabitsController = class HabitsController {
    constructor(habitsService) {
        this.habitsService = habitsService;
    }
    async list(req) {
        return this.habitsService.list('demo-user-123');
    }
    async create(req, createData) {
        return this.habitsService.create('demo-user-123', createData);
    }
    async update(id, updateData) {
        return this.habitsService.update(id, updateData);
    }
    async tick(req, id) {
        const idempotencyKey = req.headers['idempotency-key'];
        await this.habitsService.tick('demo-user-123', id, idempotencyKey);
        return { ok: true, timestamp: new Date().toISOString() };
    }
};
exports.HabitsController = HabitsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List user habits' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Habits retrieved' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HabitsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new habit' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Habit created' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HabitsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update habit' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Habit updated' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HabitsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/tick'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark habit as completed (idempotent)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Habit ticked' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('IdempotencyKey'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HabitsController.prototype, "tick", null);
exports.HabitsController = HabitsController = __decorate([
    (0, swagger_1.ApiTags)('Habits'),
    (0, common_1.Controller)('v1/habits'),
    __metadata("design:paramtypes", [habits_service_1.HabitsService])
], HabitsController);
//# sourceMappingURL=habits.controller.js.map