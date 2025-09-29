import { PrismaService } from '../prisma/prisma.service';
export declare class HabitsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string): Promise<any>;
    create(userId: string, body: any): Promise<any>;
    tick(userId: string, habitId: string): Promise<{
        ok: boolean;
        idempotent: boolean;
        streak: any;
        timestamp: any;
    }>;
    delete(userId: string, habitId: string): Promise<{
        ok: boolean;
    }>;
}
