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
exports.NudgesService = void 0;
const common_1 = require("@nestjs/common");
const mentors_service_1 = require("../mentors/mentors.service");
let OpenAI = null;
try {
    OpenAI = require('openai').OpenAI;
}
catch { }
let NudgesService = class NudgesService {
    constructor(mentors) {
        this.mentors = mentors;
    }
    async generateNudge(userId) {
        const { text, voice, voiceUrl, mentor } = await this.mentors.generateMentorLine(userId, 'primer');
        return { text, tone: voice, mentor, voice: { url: voiceUrl } };
    }
    mentorFromMode(mode, mentor) {
        const m = (mentor || mode || 'drill_sergeant').toString().toLowerCase();
        if (m.includes('marcus'))
            return 'marcus_aurelius';
        if (m.includes('confuc'))
            return 'confucius';
        if (m.includes('buddha'))
            return 'buddha';
        if (m.includes('lincoln') || m.includes('abraham'))
            return 'abraham_lincoln';
        return 'drill_sergeant';
    }
    async generateChatResponse({ userId, mode, mentor, message, includeVoice = true }) {
        const mentorKey = this.mentorFromMode(mode, mentor);
        const apiKey = process.env.OPENAI_API_KEY;
        let reply = 'Copy that.';
        if (apiKey && OpenAI) {
            const client = new OpenAI({ apiKey });
            const sys = `You are ${mentorKey.replace('_', ' ')}. Speak concisely, 1-3 sentences, motivating.`;
            const res = await client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 140,
            });
            reply = res.choices?.[0]?.message?.content?.trim() || reply;
        }
        let voiceUrl = null;
        if (includeVoice) {
            voiceUrl = await this.mentors.generateVoiceForMentor(reply, mentorKey, 'balanced');
        }
        return {
            reply,
            mentor: mentorKey,
            voice: { url: voiceUrl },
        };
    }
};
exports.NudgesService = NudgesService;
exports.NudgesService = NudgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mentors_service_1.MentorsService])
], NudgesService);
//# sourceMappingURL=nudges.service.js.map