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
exports.NudgesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nudges_service_1 = require("./nudges.service");
let NudgesController = class NudgesController {
    constructor(nudges) {
        this.nudges = nudges;
    }
    async getNudge(userId = 'demo-user-123') {
        return this.nudges.generateNudge(userId);
    }
    async chat(body) {
        const { mode, mentor, message, includeVoice = true, userId = 'demo-user-123' } = body || {};
        return this.nudges.generateChatResponse({ userId, mode, mentor, message, includeVoice });
    }
};
exports.NudgesController = NudgesController;
__decorate([
    (0, common_1.Get)('nudge'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a nudge line (text + optional voice)' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NudgesController.prototype, "getNudge", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Send message to mentor (text + optional voice)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NudgesController.prototype, "chat", null);
exports.NudgesController = NudgesController = __decorate([
    (0, swagger_1.ApiTags)('Nudges'),
    (0, common_1.Controller)('v1'),
    __metadata("design:paramtypes", [nudges_service_1.NudgesService])
], NudgesController);
//# sourceMappingURL=nudges.controller.js.map