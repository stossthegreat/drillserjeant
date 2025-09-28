import { PrismaService } from '../prisma/prisma.service';
export declare class EventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    record(userId: string, type: string, payload?: any): Promise<any>;
    list(userId: string, limit?: number): Promise<any>;
}
