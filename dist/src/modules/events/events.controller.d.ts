import { EventsService } from './events.service';
export declare class EventsController {
    private readonly events;
    constructor(events: EventsService);
    create(body: any): Promise<any>;
    list(userId?: string, limit?: string): Promise<any>;
}
