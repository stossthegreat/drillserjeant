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
exports.StreaksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const streaks_service_1 = require("./streaks.service");
const auth_guard_1 = require("../auth/auth.guard");
let StreaksController = class StreaksController {
    constructor(streaksService) {
        this.streaksService = streaksService;
    }
    async getAchievements(req) {
        return this.streaksService.getUserAchievements(req.user?.id);
    }
    async getStreakSummary(req) {
        return this.streaksService.getStreakSummary(req.user?.id);
    }
};
exports.StreaksController = StreaksController;
__decorate([
    (0, common_1.Get)('achievements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user achievements' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User achievements retrieved' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StreaksController.prototype, "getAchievements", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get streak summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Streak summary retrieved' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StreaksController.prototype, "getStreakSummary", null);
exports.StreaksController = StreaksController = __decorate([
    (0, swagger_1.ApiTags)('Streaks'),
    (0, common_1.Controller)('v1/streaks'),
    __metadata("design:paramtypes", [streaks_service_1.StreaksService])
], StreaksController);
//# sourceMappingURL=streaks.controller.js.map