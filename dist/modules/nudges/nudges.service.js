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
exports.NudgesService = void 0;
const common_1 = require("@nestjs/common");
const voice_service_1 = require("../voice/voice.service");
const openai_1 = require("openai");
let NudgesService = class NudgesService {
    constructor(voiceService) {
        this.voiceService = voiceService;
        this.mentorProfiles = {
            'drill-sergeant': {
                name: 'Drill Sergeant',
                personality: 'strict, motivational, no-nonsense',
                role: 'Military Drill Instructor',
                strengths: ['motivation', 'discipline', 'urgency']
            },
            'marcus-aurelius': {
                name: 'Marcus Aurelius',
                personality: 'stoic, wise, philosophical',
                role: 'Stoic Philosopher Emperor',
                strengths: ['wisdom', 'resilience', 'perspective']
            },
            'buddha': {
                name: 'Buddha',
                personality: 'compassionate, mindful, peaceful',
                role: 'Enlightened Teacher',
                strengths: ['mindfulness', 'compassion', 'inner peace']
            },
            'abraham-lincoln': {
                name: 'Abraham Lincoln',
                personality: 'determined, humble, inspiring',
                role: 'Visionary Leader',
                strengths: ['perseverance', 'leadership', 'character']
            },
            'confucius': {
                name: 'Confucius',
                personality: 'wise, patient, educational',
                role: 'Ancient Philosopher',
                strengths: ['wisdom', 'learning', 'virtue']
            }
        };
    }
    async generateNudge(userId) {
        const mentors = Object.keys(this.mentorProfiles);
        const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];
        const motivationalMessages = [
            "Every small step builds the foundation of greatness.",
            "Your consistency today determines your success tomorrow.",
            "Champions are made in the moments when nobody is watching.",
            "The difference between ordinary and extraordinary is that little extra.",
            "Success is not final, failure is not fatal - it's the courage to continue that counts."
        ];
        const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        return {
            nudge: message,
            mentor: randomMentor,
            timestamp: new Date().toISOString()
        };
    }
    async generateChatResponse(message, mentorKey, includeVoice = true) {
        const mentor = this.mentorProfiles[mentorKey] || this.mentorProfiles['drill-sergeant'];
        let responseText = null;
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey && message && message.trim().length > 0) {
            try {
                const openai = new openai_1.default({ apiKey });
                const systemPrompt = `You are ${mentor.name} (${mentor.role}). Speak in character. Personality: ${mentor.personality}. Respond in 2-3 sentences, direct and motivational, practical, no fluff.`;
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.8,
                    max_tokens: 220,
                });
                responseText = completion.choices?.[0]?.message?.content?.trim() || null;
            }
            catch (err) {
                console.log('OpenAI error, falling back to static personas:', err);
            }
        }
        if (!responseText) {
            const lower = message.toLowerCase();
            switch (mentorKey) {
                case 'drill-sergeant':
                    responseText = `Listen up, soldier! ${lower.includes('tired') || lower.includes('weak') ?
                        'Tired is just a state of mind. Champions push when others quit. Drop and give me 20, then get back on mission!' :
                        lower.includes('motivation') || lower.includes('help') ?
                            'Motivation fades. Discipline wins. Show up, execute, and stack small wins. That is how warriors are built.' :
                            'No excuses, no shortcuts, no surrender. You came here to improve — prove it with action today.'}`;
                    break;
                case 'marcus-aurelius':
                    responseText = `My friend, ${lower.includes('difficult') || lower.includes('hard') ?
                        'the impediment to action advances action. What stands in the way becomes the way. Use this moment to practice virtue.' :
                        lower.includes('control') || lower.includes('worry') ?
                            'attend only to what is within your control — your judgments and actions. Let the rest pass by like the wind.' :
                            'you have power over your mind, not outside events. Choose reason over impulse and proceed with calm resolve.'}`;
                    break;
                case 'buddha':
                    responseText = `Dear friend, ${lower.includes('suffering') || lower.includes('pain') ?
                        'pain is inevitable, but suffering is optional. Accept the present moment gently and let go of clinging.' :
                        lower.includes('anxious') || lower.includes('worried') ?
                            'breathe and return to now. Peace lives in the present; the future is only thought. Let the mind settle like a still pond.' :
                            'the mind is everything. What you think, you become. Practice kindness toward yourself and begin again.'}`;
                    break;
                case 'abraham-lincoln':
                    responseText = `My friend, ${lower.includes('failure') || lower.includes('failed') ?
                        'failure is not falling down; it is staying down. Determine that the thing can and shall be done, and then find the way.' :
                        lower.includes('give up') || lower.includes('quit') ?
                            'I am a slow walker, but I never walk back. Persevere today; your character is forged in such moments.' :
                            'the best way to predict your future is to create it. Act with integrity and purpose, and you will not walk alone.'}`;
                    break;
                case 'confucius':
                    responseText = `Wise one, ${lower.includes('slow') || lower.includes('progress') ?
                        'it does not matter how slowly you go so long as you do not stop. Carry away small stones and the mountain will move.' :
                        lower.includes('mistake') || lower.includes('wrong') ?
                            'our greatest glory is not in never falling, but in rising every time we fall. Learn, correct, continue.' :
                            'by reflection, imitation, and experience we gain wisdom. Reflect now and choose the right next step.'}`;
                    break;
                default:
                    responseText = 'Stay strong and keep pushing forward. Every challenge is an opportunity to grow.';
            }
        }
        let voiceData = null;
        if (includeVoice) {
            try {
                voiceData = await this.voiceService.generateTTS(responseText, mentorKey);
            }
            catch (error) {
                console.log('Voice generation failed:', error);
            }
        }
        return {
            message: responseText,
            mentor: mentorKey,
            type: 'chat_response',
            voice: voiceData,
        };
    }
};
exports.NudgesService = NudgesService;
exports.NudgesService = NudgesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => voice_service_1.VoiceService))),
    __metadata("design:paramtypes", [voice_service_1.VoiceService])
], NudgesService);
//# sourceMappingURL=nudges.service.js.map