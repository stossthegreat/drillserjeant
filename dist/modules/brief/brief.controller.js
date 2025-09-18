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
exports.BriefController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const brief_service_1 = require("./brief.service");
const auth_guard_1 = require("../auth/auth.guard");
let BriefController = class BriefController {
    constructor(briefService) {
        this.briefService = briefService;
    }
    async getTodaysBrief(req) {
        const userId = req.user?.id;
        return this.briefService.getTodaysBrief(userId);
    }
};
exports.BriefController = BriefController;
__decorate([
    (0, common_1.Get)('today'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive daily brief' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily brief with missions, achievements, and targets' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BriefController.prototype, "getTodaysBrief", null);
exports.BriefController = BriefController = __decorate([
    (0, swagger_1.ApiTags)('Brief'),
    (0, common_1.Controller)('v1/brief'),
    __metadata("design:paramtypes", [brief_service_1.BriefService])
], BriefController);
//# sourceMappingURL=brief.controller.js.map