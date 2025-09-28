import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import { MentorsService } from '../mentors/mentors.service';
export declare class ScheduleService {
    private readonly prisma;
    private readonly queues;
    private readonly mentors;
    private readonly logger;
    constructor(prisma: PrismaService, queues: QueuesService, mentors: MentorsService);
    morningPrimer(): Promise<void>;
    middayScan(): Promise<void>;
    eveningReflection(): Promise<void>;
    weeklyReport(): Promise<void>;
    randomInterruption(): Promise<void>;
    private generateAndStoreLine;
}
