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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreaksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const streaks_service_1 = require("./streaks.service");
let StreaksController = class StreaksController {
    constructor(streaks) {
        this.streaks = streaks;
    }
    async achievements(req) {
        const userId = req.user?.id || 'demo-user-123';
        return this.streaks.getAchievements(userId);
    }
    async summary(req) {
        const userId = req.user?.id || 'demo-user-123';
        return this.streaks.getSummary(userId);
    }
};
exports.StreaksController = StreaksController;
__decorate([
    (0, common_1.Get)('achievements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get achievements' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StreaksController.prototype, "achievements", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get streak summary' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StreaksController.prototype, "summary", null);
exports.StreaksController = StreaksController = __decorate([
    (0, swagger_1.ApiTags)('Streaks'),
    (0, common_1.Controller)('v1/streaks'),
    __metadata("design:paramtypes", [typeof (_a = typeof streaks_service_1.StreaksService !== "undefined" && streaks_service_1.StreaksService) === "function" ? _a : Object])
], StreaksController);
//# sourceMappingURL=streaks.controller.js.map