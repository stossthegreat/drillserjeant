import { Injectable } from '@nestjs/common';

@Injectable()
export class NudgesService {
  private mentors = {
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

  async generateNudge(userId: string) {
    // Simple progress calculation (in real app, this would check actual user data)
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
} 