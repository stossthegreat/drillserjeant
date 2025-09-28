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
exports.VoiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const voice_service_1 = require("./voice.service");
const mentors_service_1 = require("../mentors/mentors.service");
let VoiceController = class VoiceController {
    constructor(voice, mentors) {
        this.voice = voice;
        this.mentors = mentors;
    }
    async tts(body) {
        const { text, voice = 'balanced' } = body || {};
        const url = await this.voice['generateTTS'](text, voice);
        return { url };
    }
    async preset(id) {
        return this.voice.getPreset(id);
    }
    async preload(body) {
        const { mentor, lines } = body || {};
        const key = (mentor || 'drill_sergeant');
        const results = [];
        for (const line of (lines || [])) {
            const url = await this.mentors.generateVoiceForMentor(line, key, 'balanced');
            if (url)
                results.push(url);
        }
        return { cached: results.length };
    }
};
exports.VoiceController = VoiceController;
__decorate([
    (0, common_1.Post)('tts'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate TTS for text' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceController.prototype, "tts", null);
__decorate([
    (0, common_1.Get)('preset/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get preset voice line' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoiceController.prototype, "preset", null);
__decorate([
    (0, common_1.Post)('preload'),
    (0, swagger_1.ApiOperation)({ summary: 'Preload and cache voice lines for a mentor' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceController.prototype, "preload", null);
exports.VoiceController = VoiceController = __decorate([
    (0, swagger_1.ApiTags)('Voice'),
    (0, common_1.Controller)('v1/voice'),
    __metadata("design:paramtypes", [voice_service_1.VoiceService, mentors_service_1.MentorsService])
], VoiceController);
//# sourceMappingURL=voice.controller.js.map