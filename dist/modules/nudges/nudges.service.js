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
        this.mentors = {
            'drill-sergeant': {
                name: 'Drill Sergeant',
                nudges: {
                    high_progress: [
                        "Outstanding work, soldier! Keep that momentum!",
                        "Now THAT'S what I call discipline! Carry on!",
                        "Excellent execution! You're setting the standard!"
                    ],
                    low_progress: [
                        "DROP AND GIVE ME TWENTY! Your progress is pathetic today!",
                        "What's your excuse, recruit? GET MOVING!",
                        "I've seen snails move faster than your progress today!"
                    ]
                }
            },
            'marcus-aurelius': {
                name: 'Marcus Aurelius',
                nudges: {
                    high_progress: [
                        "Well done. Your commitment to virtue shines through your actions.",
                        "The universe is change; our life is what our thoughts make it. Yours are noble.",
                        "You are making progress on the path of wisdom and self-discipline."
                    ],
                    low_progress: [
                        "Remember, what we do now echoes in eternity. Rise to the occasion.",
                        "The impediment to action advances action. What stands in the way becomes the way.",
                        "You have power over your mind - not outside events. Realize this, and you will find strength."
                    ]
                }
            }
        };
    }
    async generateNudge(userId) {
        const progress = Math.random() * 100;
        const mentorId = 'drill-sergeant';
        const mentor = this.mentors[mentorId];
        const nudgeType = progress > 70 ? 'high_progress' : 'low_progress';
        const messages = mentor.nudges[nudgeType];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        return {
            nudge: {
                type: nudgeType,
                message: randomMessage,
                mentorId,
                mentorName: mentor.name,
                progressPercent: Math.round(progress),
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.NudgesService = NudgesService;
exports.NudgesService = NudgesService = __decorate([
    (0, common_1.Injectable)()
], NudgesService);
//# sourceMappingURL=nudges.service.js.map