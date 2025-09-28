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
let VoiceService = class VoiceService {
    constructor() { }
    async getPreset(id) {
        const phrases = {
            'praise_30_day': 'Thirty days strong. Outstanding discipline.',
            'alarm_wake': 'Up! Out of bed. Mission starts now.',
            'streak_save': 'Saved the streak. Keep the momentum.',
            'DGzg6RaUqxGRTHSBjfgF': 'Outstanding work, soldier! Keep pushing forward!',
        };
        const text = phrases[id];
        if (!text) {
            const defaultText = 'Outstanding work! Keep pushing forward!';
            try {
                const url = await this.generateTTS(defaultText, 'balanced');
                return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
            }
            catch (error) {
                return {
                    url: null,
                    message: defaultText,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                };
            }
        }
        try {
            const url = await this.generateTTS(text, 'balanced');
            return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
        }
        catch (error) {
            return {
                url: null,
                message: text,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
        }
    }
    async generateTTS(text, tone) {
        const voiceId = tone === 'strict'
            ? process.env.ELEVENLABS_VOICE_STRICT
            : tone === 'light'
                ? process.env.ELEVENLABS_VOICE_LIGHT
                : process.env.ELEVENLABS_VOICE_BALANCED;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey || !voiceId)
            return null;
        const fetch = (await Promise.resolve().then(() => require('node-fetch'))).default;
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg',
            },
            body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
        });
        if (!res.ok)
            return null;
        const buffer = await res.arrayBuffer();
        return `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`;
    }
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VoiceService);
//# sourceMappingURL=voice.service.js.map