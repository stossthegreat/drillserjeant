import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    list(req: any): Promise<{
        id: string;
        userId: string;
        title: string;
        description: string;
        dueDate: string;
        completed: boolean;
        completedAt: any;
        createdAt: string;
    }[]>;
    create(req: any, createData: any): Promise<any>;
    complete(req: any, id: string): Promise<{
        ok: boolean;
        timestamp: string;
    }>;
}
