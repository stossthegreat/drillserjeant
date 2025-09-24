"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NudgesService = void 0;
const common_1 = require("@nestjs/common");
let NudgesService = class NudgesService {
    constructor() {
        this.mentorProfiles = {
            'drill-sergeant': {
                name: 'Drill Sergeant',
                personality: 'strict',
                voice: 'commanding',
                strengths: ['motivation', 'discipline', 'urgency'],
                messages: {
                    morning: [
                        "Rise and shine, soldier! Today's battle begins now!",
                        "The enemy is complacency. Attack it with action!",
                        "Winners don't wait for motivation - they CREATE it!"
                    ],
                    afternoon: [
                        "Half-time report: Are you winning or making excuses?",
                        "The day's not over! Push through that afternoon slump!",
                        "Champions separate themselves in moments like this!"
                    ],
                    evening: [
                        "Day's end assessment: Did you give it everything?",
                        "Tomorrow's victory is built on today's discipline!",
                        "Reflect, regroup, and prepare for tomorrow's assault!"
                    ],
                    weekend: [
                        "Weekends don't mean weakness! Stay sharp!",
                        "While others rest, champions advance!",
                        "Weekend warrior mode: ACTIVATED!"
                    ],
                    streak_risk: [
                        "ALERT: Your streak is in danger! Defend it!",
                        "I see weakness creeping in. ELIMINATE IT!",
                        "Your streak didn't build itself. PROTECT IT!"
                    ],
                    high_performer: [
                        "Outstanding execution! This is what excellence looks like!",
                        "You're setting the standard! Keep that momentum!",
                        "Exceptional work! Now raise the bar even higher!"
                    ]
                }
            },
            'marcus-aurelius': {
                name: 'Marcus Aurelius',
                personality: 'philosophical',
                voice: 'wise',
                strengths: ['wisdom', 'reflection', 'stoicism'],
                messages: {
                    morning: [
                        "Each dawn brings opportunity to practice virtue.",
                        "What we do now echoes in eternity. Choose wisely.",
                        "The universe is change; our life is what our thoughts make it."
                    ],
                    afternoon: [
                        "Remember: what stands in the way becomes the way.",
                        "You have power over your mind - not outside events.",
                        "The impediment to action advances action."
                    ],
                    evening: [
                        "Reflect on the day with gratitude and wisdom.",
                        "Today's actions were seeds for tomorrow's harvest.",
                        "End the day knowing you lived with purpose."
                    ],
                    weekend: [
                        "Rest is not idleness; it is preparation for growth.",
                        "Use this time for reflection and renewal.",
                        "Even in rest, the wise mind continues to learn."
                    ]
                }
            },
            'buddha': {
                name: 'Buddha',
                personality: 'compassionate',
                voice: 'gentle',
                strengths: ['mindfulness', 'compassion', 'peace'],
                messages: {
                    morning: [
                        "Begin this day with mindful intention.",
                        "Each moment is a fresh beginning.",
                        "Approach today with compassion for yourself."
                    ],
                    afternoon: [
                        "Notice this moment. You are exactly where you need to be.",
                        "Progress is not about perfection, but about presence.",
                        "Breathe. Center yourself. Continue with awareness."
                    ],
                    evening: [
                        "Let go of today's struggles with loving kindness.",
                        "Tomorrow will bring new opportunities for growth.",
                        "Rest in the peace of having done your best."
                    ]
                }
            },
            'abraham-lincoln': {
                name: 'Abraham Lincoln',
                personality: 'encouraging',
                voice: 'steady',
                strengths: ['perseverance', 'hope', 'determination'],
                messages: {
                    morning: [
                        "The best way to predict the future is to create it.",
                        "Today is another chance to build something meaningful.",
                        "Great things are accomplished by those who persist."
                    ],
                    afternoon: [
                        "When you reach the end of your rope, tie a knot and hang on.",
                        "The path may be difficult, but the destination is worth it.",
                        "Character is like a tree and reputation like its shadow."
                    ],
                    evening: [
                        "You cannot escape the responsibility of tomorrow by evading it today.",
                        "End this day knowing you faced it with courage.",
                        "Tomorrow holds promise for those who persevere."
                    ]
                }
            },
            'confucius': {
                name: 'Confucius',
                personality: 'wise',
                voice: 'teaching',
                strengths: ['learning', 'growth', 'wisdom'],
                messages: {
                    morning: [
                        "Every day is a chance to learn something new.",
                        "The person who asks a question is a fool for five minutes.",
                        "Begin today with the curiosity of a student."
                    ],
                    afternoon: [
                        "Real knowledge is knowing the extent of one's ignorance.",
                        "The wise find pleasure in water; the virtuous find pleasure in hills.",
                        "Study the past if you would define the future."
                    ],
                    evening: [
                        "By three methods we may learn wisdom: reflection, imitation, and experience.",
                        "What did today teach you about yourself?",
                        "The superior man thinks of virtue; the small man thinks of comfort."
                    ]
                }
            }
        };
    }
    async generateNudge(userId, habits = [], tasks = []) {
        const intelligence = this.analyzeContext(habits, tasks);
        const smartNudge = this.generateSmartNudge(intelligence);
        return {
            nudge: smartNudge.message,
            mentor: smartNudge.mentor,
            type: smartNudge.type,
            timestamp: new Date().toISOString(),
            intelligence: smartNudge.intelligence,
            source: 'smart_nudge_v1'
        };
    }
    analyzeContext(habits, tasks) {
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        const todayCompletions = habits.filter(h => {
            if (!h.lastTick)
                return false;
            const tickDate = new Date(h.lastTick).toDateString();
            return tickDate === now.toDateString();
        }).length;
        const totalHabits = habits.length;
        const progressPercent = totalHabits > 0 ? (todayCompletions / totalHabits) * 100 : 0;
        const streaksAtRisk = habits.filter(h => {
            if (!h.lastTick)
                return true;
            const daysSinceLastTick = (Date.now() - new Date(h.lastTick).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLastTick > 1;
        }).length;
        return {
            timeOfDay: hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening',
            isWeekend,
            progressPercent,
            streaksAtRisk,
            totalHabits,
            todayCompletions,
            userType: this.classifyUser(progressPercent, streaksAtRisk)
        };
    }
    classifyUser(progressPercent, streaksAtRisk) {
        if (progressPercent > 80 && streaksAtRisk === 0)
            return 'high_performer';
        if (streaksAtRisk > 2)
            return 'streak_risk';
        if (progressPercent < 30)
            return 'needs_motivation';
        return 'steady_progress';
    }
    generateSmartNudge(context) {
        let selectedMentor = 'drill-sergeant';
        let messageCategory = context.timeOfDay;
        if (context.userType === 'high_performer') {
            selectedMentor = Math.random() > 0.5 ? 'marcus-aurelius' : 'abraham-lincoln';
            messageCategory = 'high_performer';
        }
        else if (context.userType === 'streak_risk') {
            selectedMentor = 'drill-sergeant';
            messageCategory = 'streak_risk';
        }
        else if (context.userType === 'needs_motivation') {
            selectedMentor = Math.random() > 0.5 ? 'drill-sergeant' : 'abraham-lincoln';
        }
        else if (context.isWeekend) {
            messageCategory = 'weekend';
        }
        const mentor = this.mentorProfiles[selectedMentor];
        const messages = mentor.messages[messageCategory] || mentor.messages.morning;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        let enhancedMessage = randomMessage;
        if (context.todayCompletions > 0) {
            enhancedMessage += ` You've already completed ${context.todayCompletions} habit${context.todayCompletions === 1 ? '' : 's'} today!`;
        }
        if (context.streaksAtRisk > 0 && messageCategory !== 'streak_risk') {
            enhancedMessage += ` Watch out - ${context.streaksAtRisk} streak${context.streaksAtRisk === 1 ? ' is' : 's are'} at risk.`;
        }
        return {
            message: enhancedMessage,
            mentor: selectedMentor,
            type: context.userType,
            intelligence: {
                timeBasedFactor: this.calculateTimeFactor(context.timeOfDay),
                patternRecognition: `Progress: ${Math.round(context.progressPercent)}%, Risk: ${context.streaksAtRisk} habits`,
                personalityAdaptation: `Selected ${mentor.name} for ${context.userType} user type`
            }
        };
    }
    calculateTimeFactor(timeOfDay) {
        switch (timeOfDay) {
            case 'morning': return 0.9;
            case 'afternoon': return 0.6;
            case 'evening': return 0.7;
            default: return 0.5;
        }
    }
    async generateChatResponse(message, mentorKey) {
        const mentor = this.mentorProfiles[mentorKey] || this.mentorProfiles['drill-sergeant'];
        const responses = {
            'drill-sergeant': [
                "Listen up! That attitude will get you nowhere. Push harder!",
                "Drop and give me 20! Then we'll talk about your problems.",
                "No excuses! Winners find a way, losers find excuses.",
                "You think this is hard? Wait until life hits you. Stay disciplined!",
                "Outstanding question! Now show me outstanding action!"
            ],
            'marcus-aurelius': [
                "Remember, what we do now echoes in eternity. Choose wisely.",
                "The impediment to action advances action. What stands in the way becomes the way.",
                "You have power over your mind - not outside events. Realize this, and you will find strength.",
                "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
                "The best revenge is not to be like your enemy."
            ],
            'buddha': [
                "Peace comes from within. Do not seek it without.",
                "The mind is everything. What you think you become.",
                "Three things cannot be long hidden: the sun, the moon, and the truth.",
                "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
                "Hatred does not cease by hatred, but only by love; this is the eternal rule."
            ],
            'abraham-lincoln': [
                "Most folks are as happy as they make up their minds to be.",
                "The best way to predict your future is to create it.",
                "Whatever you are, be a good one.",
                "I am a slow walker, but I never walk back.",
                "Give me six hours to chop down a tree and I will spend the first four sharpening the axe."
            ],
            'confucius': [
                "It does not matter how slowly you go as long as you do not stop.",
                "The man who moves a mountain begins by carrying away small stones.",
                "Our greatest glory is not in never falling, but in rising every time we fall.",
                "Real knowledge is to know the extent of one's ignorance.",
                "By three methods we may learn wisdom: First, by reflection, which is noblest; Second, by imitation, which is easiest; and third by experience, which is the bitterest."
            ]
        };
        const mentorResponses = responses[mentorKey] || responses['drill-sergeant'];
        const randomResponse = mentorResponses[Math.floor(Math.random() * mentorResponses.length)];
        return {
            message: randomResponse,
            mentor: mentorKey,
            type: 'chat_response',
            voice: null
        };
    }
};
exports.NudgesService = NudgesService;
exports.NudgesService = NudgesService = __decorate([
    (0, common_1.Injectable)()
], NudgesService);
//# sourceMappingURL=nudges.service.js.map