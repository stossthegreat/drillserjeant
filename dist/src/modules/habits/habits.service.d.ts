import { PrismaService } from '../prisma/prisma.service';
export declare class HabitsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string): Promise<any>;
    tick(userId: string, habitId: string): Promise<{
        ok: boolean;
        habit: any;
    }>;
}
