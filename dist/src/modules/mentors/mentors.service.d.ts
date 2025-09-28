import { PrismaService } from '../prisma/prisma.service';
export type MentorKey = 'drill_sergeant' | 'marcus_aurelius' | 'confucius' | 'buddha' | 'abraham_lincoln';
type Tone = 'strict' | 'balanced' | 'light';
export declare class MentorsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private pickMentor;
    generateMentorLine(userId: string, kind: string): Promise<{
        text: string;
        voice: Tone;
        voiceUrl: string | null;
        mentor: MentorKey;
    }>;
    private generateText;
    private buildSystemPrompt;
    private fallbackLine;
    private generateVoice;
    private mapMentorToVoice;
    private mapToneToVoice;
    generateVoiceForMentor(text: string, mentor: MentorKey, tone?: Tone): Promise<string | null>;
    private synthesizeWithVoiceId;
    private hash;
}
export {};
