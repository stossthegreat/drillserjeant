"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const common_1 = require("@nestjs/common");
let VoiceService = class VoiceService {
    constructor() {
        this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.mentorVoices = {
            'drill-sergeant': process.env.ELEVENLABS_VOICE_DRILL || 'pNInz6obpgDQGcFmaJgB',
            'marcus-aurelius': process.env.ELEVENLABS_VOICE_MARCUS || 'EXAVITQu4vr4xnSDxMaL',
            'buddha': process.env.ELEVENLABS_VOICE_BUDDHA || 'ErXwobaYiN019PkySvjV',
            'abraham-lincoln': process.env.ELEVENLABS_VOICE_LINCOLN || '21m00Tcm4TlvDq8ikWAM',
            'confucius': process.env.ELEVENLABS_VOICE_CONFUCIUS || 'AZnzlk1XvdvUeBnXmlld'
        };
    }
    async generateTTS(text, mentor = 'drill-sergeant') {
        const voiceId = this.mentorVoices[mentor] || this.mentorVoices['drill-sergeant'];
        if (!this.elevenLabsApiKey) {
            console.log('⚠️ ElevenLabs API key not configured, using mock TTS');
            return {
                audioUrl: `https://mock-tts.com/audio/${encodeURIComponent(text)}`,
                voice: mentor,
                voiceId,
                text,
                source: 'mock',
                timestamp: new Date().toISOString()
            };
        }
        try {
            console.log(`🎵 Generating ElevenLabs TTS for ${mentor}: "${text.substring(0, 50)}..."`);
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsApiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.3,
                        similarity_boost: 0.8,
                        style: 0.2,
                        use_speaker_boost: true
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
            }
            const audioBuffer = await response.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');
            console.log(`✅ ElevenLabs TTS generated successfully for ${mentor}`);
            return {
                audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
                voice: mentor,
                voiceId,
                text,
                source: 'elevenlabs',
                charCount: text.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error(`❌ ElevenLabs TTS error for ${mentor}: ${error.message}`);
            return {
                audioUrl: `https://mock-tts.com/audio/${encodeURIComponent(text)}`,
                voice: mentor,
                voiceId,
                text,
                source: 'fallback',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    getMentorVoices() {
        return Object.keys(this.mentorVoices);
    }
    async testVoice(mentor = 'drill-sergeant') {
        const testMessage = `Hello! This is ${mentor.replace('-', ' ')} speaking. Your voice system is working perfectly!`;
        return this.generateTTS(testMessage, mentor);
    }
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = __decorate([
    (0, common_1.Injectable)()
], VoiceService);
//# sourceMappingURL=voice.service.js.map