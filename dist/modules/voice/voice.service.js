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
exports.VoiceService = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("../billing/billing.service");
let VoiceService = class VoiceService {
    constructor(billing) {
        this.billing = billing;
    }
    async getPreset(id) {
        const presets = {
            'praise_30_day': 'https://example.com/audio/praise_30_day.mp3',
            'alarm_wake': 'https://example.com/audio/alarm_wake.mp3',
            'streak_save': 'https://example.com/audio/streak_save.mp3',
        };
        const url = presets[id];
        if (!url) {
            throw new Error('Preset not found');
        }
        return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
    }
    async synthesize(userId, text, voice) {
        const plan = this.billing.getUserPlan(userId);
        if (plan !== 'PRO') {
            throw new common_1.ForbiddenException('Dynamic TTS requires PRO plan. Upgrade to continue.');
        }
        const allowed = await this.billing.checkQuota(userId, 'tts', text.length);
        if (!allowed) {
            throw new common_1.ForbiddenException('Daily TTS quota exceeded. Try again tomorrow.');
        }
        const cacheKey = this.generateCacheKey(text, voice);
        const cached = await this.checkCache(cacheKey);
        if (cached) {
            return {
                url: cached.url,
                cached: true,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
        }
        const audioUrl = await this.generateTTS(text, voice);
        await this.cacheResult(cacheKey, audioUrl, text, voice);
        await this.billing.incrementUsage(userId, 'tts', text.length);
        return {
            url: audioUrl,
            cached: false,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            usage: {
                charsUsed: text.length,
                charsRemaining: (await this.billing.getUsage(userId)).remaining.ttsChars
            }
        };
    }
    generateCacheKey(text, voice) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(text + (voice || 'balanced')).digest('hex');
    }
    async checkCache(cacheKey) {
        return null;
    }
    async generateTTS(text, voice) {
        const voiceId = this.getVoiceId(voice);
        console.log(`🎙️  [MOCK] ElevenLabs TTS: voice=${voiceId}, chars=${text.length}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return `https://example.com/audio/tts_${Date.now()}.mp3`;
    }
    async cacheResult(cacheKey, url, text, voice) {
        console.log(`💾 Caching TTS result: ${cacheKey.substring(0, 8)}...`);
    }
    getVoiceId(voice) {
        const voiceMap = {
            strict: process.env.ELEVENLABS_VOICE_STRICT || 'voice_strict',
            balanced: process.env.ELEVENLABS_VOICE_BALANCED || 'voice_balanced',
            light: process.env.ELEVENLABS_VOICE_LIGHT || 'voice_light'
        };
        return voiceMap[voice || 'balanced'];
    }
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], VoiceService);
//# sourceMappingURL=voice.service.js.map