import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    chat(req: any, body: {
        message: string;
        mode?: string;
        history?: any[];
    }): Promise<{
        reply: any;
        updates: any[];
        suggested_actions: ({
            type: string;
            time: string;
            message: string;
        } | {
            type: string;
            message: string;
            time?: undefined;
        })[];
        confidence: number;
        source: string;
    } | {
        error: string;
        source: string;
        reply: any;
        updates: any[];
        suggested_actions: ({
            type: string;
            time: string;
            message: string;
        } | {
            type: string;
            message: string;
            time?: undefined;
        })[];
        confidence: number;
    }>;
}
