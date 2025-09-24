"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
let TasksService = class TasksService {
    constructor() {
        this.tasks = [
            {
                id: 'task-1',
                userId: 'demo-user-123',
                title: 'Complete project proposal',
                description: 'Finish the quarterly project proposal',
                dueDate: new Date().toISOString(),
                completed: false,
                completedAt: null,
                createdAt: '2024-01-01T00:00:00Z'
            }
        ];
    }
    async list(userId) {
        return this.tasks.filter(task => task.userId === userId);
    }
    async create(userId, taskData) {
        const newTask = {
            id: `task-${Date.now()}`,
            userId,
            title: taskData.title || taskData.name,
            description: taskData.description || '',
            dueDate: taskData.dueDate || new Date().toISOString(),
            completed: false,
            createdAt: new Date().toISOString(),
            ...taskData
        };
        this.tasks.push(newTask);
        return newTask;
    }
    completeTask(id, userId) {
        const task = this.tasks.find(t => t.id === id && t.userId === userId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (task.completed) {
            return task;
        }
        task.completed = true;
        task.completedAt = new Date().toISOString();
        return task;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)()
], TasksService);
//# sourceMappingURL=tasks.service.js.map