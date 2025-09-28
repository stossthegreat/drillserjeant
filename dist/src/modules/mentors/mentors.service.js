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
exports.MentorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OpenAI = null;
try {
    OpenAI = require('openai').OpenAI;
}
catch { }
let MentorsService = class MentorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    pickMentor(kind) {
        if (kind === 'primer')
            return { key: 'drill_sergeant', tone: 'balanced' };
        if (kind === 'evening_reflection')
            return { key: 'marcus_aurelius', tone: 'light' };
        const keys = ['drill_sergeant', 'marcus_aurelius', 'confucius', 'buddha', 'abraham_lincoln'];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const tones = ['strict', 'balanced', 'light'];
        const tone = tones[Math.floor(Math.random() * tones.length)];
        return { key, tone };
    }
    async generateMentorLine(userId, kind) {
        const { key, tone } = this.pickMentor(kind);
        const text = await this.generateText(userId, key, tone, kind);
        const voiceUrl = await this.generateVoice(text, key, tone);
        return { text, voice: tone, voiceUrl, mentor: key };
    }
    async generateText(userId, mentor, tone, kind) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey && OpenAI) {
            const client = new OpenAI({ apiKey });
            const sys = this.buildSystemPrompt(mentor, tone, kind);
            const res = await client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: `User: ${userId}. Generate a single, powerful line.` },
                ],
                temperature: 0.7,
                max_tokens: 120,
            });
            const text = res.choices?.[0]?.message?.content?.trim();
            if (text)
                return text;
        }
        return this.fallbackLine(mentor, tone, kind);
    }
    buildSystemPrompt(mentor, tone, kind) {
        const persona = {
            drill_sergeant: 'Direct, commanding, punchy. 1-2 sentences max.',
            marcus_aurelius: 'Stoic, reflective, concise aphorism.',
            confucius: 'Wise, ordered, principle-based guidance.',
            buddha: 'Calm, mindful, compassionate focus cue.',
            abraham_lincoln: 'Measured, moral resolve, unifying.'
        }[mentor];
        const style = tone === 'strict' ? 'urgent' : tone === 'light' ? 'gentle' : 'motivational';
        return [
            `You are ${mentor.replace('_', ' ')}.`,
            `Style: ${persona} Tone: ${style}.`,
            `Context: ${kind}.`,
            `Output: One short, memorable line (max 30 words). No preface.`
        ].join('\n');
    }
    fallbackLine(mentor, tone, kind) {
        const map = {
            primer: [
                'Up and move. First rep, then momentum.',
                'Begin now. Small spark, big fire.'
            ],
            midday_scan: [
                'Check alignment. One decisive action now.',
                'Course-correct: eliminate one distraction.'
            ],
            evening_reflection: [
                'Close the day with honesty. What one thing made you better?',
                'Be grateful, be precise, sleep ready.'
            ],
            random_interrupt: [
                'Surprise check: name your next action and do it.',
                'Prove it right now. One clean rep.'
            ],
        };
        const arr = map[kind] || ['Stay on target.'];
        return arr[Math.floor(Math.random() * arr.length)];
    }
    async generateVoice(text, mentor, tone) {
        const voiceId = this.mapMentorToVoice(mentor) || this.mapToneToVoice(tone);
        const key = this.hash(text + '|' + voiceId);
        const existing = await this.prisma.voiceCache.findUnique({ where: { id: key } });
        if (existing)
            return existing.url;
        const url = await this.synthesizeWithVoiceId(text, voiceId);
        if (url) {
            await this.prisma.voiceCache.create({ data: { id: key, text, voice: voiceId, url } });
        }
        return url;
    }
    mapMentorToVoice(mentor) {
        const env = process.env;
        const candidates = [];
        switch (mentor) {
            case 'drill_sergeant':
                candidates.push(env.ELEVENLABS_VOICE_DRILL);
                candidates.push(env.ELEVENLABS_VOICE_DRILL_SERGEANT);
                candidates.push(env.ELEVENLABS_VOICE_DRILLSERGEANT);
                candidates.push(env.ELEVENLABS_DRILL_SERGEANT_VOICE);
                break;
            case 'marcus_aurelius':
                candidates.push(env.ELEVENLABS_VOICE_MARCUS_AURELIUS);
                candidates.push(env.ELEVENLABS_VOICE_MARCUS);
                candidates.push(env.ELEVENLABS_MARCUS_AURELIUS_VOICE);
                break;
            case 'confucius':
                candidates.push(env.ELEVENLABS_VOICE_CONFUCIUS);
                candidates.push(env.ELEVENLABS_CONFUCIUS_VOICE);
                break;
            case 'buddha':
                candidates.push(env.ELEVENLABS_VOICE_BUDDHA);
                candidates.push(env.ELEVENLABS_BUDDHA_VOICE);
                break;
            case 'abraham_lincoln':
                candidates.push(env.ELEVENLABS_VOICE_ABRAHAM_LINCOLN);
                candidates.push(env.ELEVENLABS_VOICE_LINCOLN);
                candidates.push(env.ELEVENLABS_ABRAHAM_LINCOLN_VOICE);
                break;
        }
        return candidates.find(Boolean);
    }
    mapToneToVoice(tone) {
        if (tone === 'strict')
            return process.env.ELEVENLABS_VOICE_STRICT || 'voice_strict';
        if (tone === 'light')
            return process.env.ELEVENLABS_VOICE_LIGHT || 'voice_light';
        return process.env.ELEVENLABS_VOICE_BALANCED || 'voice_balanced';
    }
    async generateVoiceForMentor(text, mentor, tone = 'balanced') {
        const voiceId = this.mapMentorToVoice(mentor) || this.mapToneToVoice(tone);
        return this.synthesizeWithVoiceId(text, voiceId);
    }
    async synthesizeWithVoiceId(text, voiceId) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey || !voiceId)
            return null;
        try {
            const fetch = (await Promise.resolve().then(() => require('node-fetch'))).default;
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
            });
            if (!res.ok)
                return null;
            const arrayBuffer = await res.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return `data:audio/mpeg;base64,${base64}`;
        }
        catch (e) {
            return null;
        }
    }
    hash(s) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(s).digest('hex');
    }
};
exports.MentorsService = MentorsService;
exports.MentorsService = MentorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MentorsService);
//# sourceMappingURL=mentors.service.js.map