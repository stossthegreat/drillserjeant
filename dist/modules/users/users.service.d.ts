export declare class UsersService {
    findById(id: string): Promise<{
        id: string;
        email: string;
        tone: string;
        intensity: number;
        consentRoast: boolean;
        plan: string;
    }>;
    update(id: string, data: any): Promise<any>;
}
