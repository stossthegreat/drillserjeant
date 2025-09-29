import { PrismaService } from '../prisma/prisma.service';
import { MentorsService } from '../mentors/mentors.service';
import { QueuesService } from '../queues/queues.service';
export declare class BriefService {
    private readonly prisma;
    private readonly mentors;
    private readonly queues;
    constructor(prisma: PrismaService, mentors: MentorsService, queues: QueuesService);
    getToday(userId: string): Promise<{
        date: string;
        habits: any;
        tasks: any[];
        nudge: any;
    }>;
    private isScheduledToday;
}
