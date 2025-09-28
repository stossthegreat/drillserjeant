import { PrismaService } from '../prisma/prisma.service';
export declare class AlarmsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string): Promise<any>;
    create(userId: string, body: any): Promise<any>;
    dismiss(id: string): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
