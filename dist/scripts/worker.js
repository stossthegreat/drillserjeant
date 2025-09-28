"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
async function main() {
    const prisma = new client_1.PrismaClient();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    new bullmq_1.Worker('notifications', async (job) => {
        try {
            if (job.name === 'notify') {
                const { userId, text, voiceUrl, kind, mentor } = job.data || {};
                await prisma.event.create({
                    data: {
                        userId: userId || 'demo-user-123',
                        type: `notify_${kind || 'generic'}`,
                        payload: { text, voiceUrl, mentor },
                    },
                });
            }
            return true;
        }
        catch (e) {
            console.error('notifications worker error', e);
            throw e;
        }
    }, { connection });
    new bullmq_1.Worker('reports', async (job) => {
        try {
            if (job.name === 'weekly_report') {
                const { userId } = job.data || {};
                await prisma.event.create({ data: { userId: userId || 'demo-user-123', type: 'weekly_report_generated', payload: {} } });
            }
            return true;
        }
        catch (e) {
            console.error('reports worker error', e);
            throw e;
        }
    }, { connection });
    console.log('BullMQ workers up');
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map