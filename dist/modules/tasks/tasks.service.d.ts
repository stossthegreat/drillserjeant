export declare class TasksService {
    private tasks;
    list(userId: string): Promise<{
        id: string;
        userId: string;
        title: string;
        description: string;
        dueDate: string;
        completed: boolean;
        completedAt: any;
        createdAt: string;
    }[]>;
    create(userId: string, taskData: any): Promise<any>;
    completeTask(id: string, userId: string): {
        id: string;
        userId: string;
        title: string;
        description: string;
        dueDate: string;
        completed: boolean;
        completedAt: any;
        createdAt: string;
    };
}
