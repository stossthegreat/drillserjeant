import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
  private tasks = [
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

  async list(userId: string) {
    return this.tasks.filter(task => task.userId === userId);
  }

  async create(userId: string, taskData: any) {
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

  completeTask(id: string, userId: string) {
    const task = this.tasks.find(t => t.id === id && t.userId === userId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    if (task.completed) {
      return task; // Already completed
    }
    
    task.completed = true;
    task.completedAt = new Date().toISOString();
    return task;
  }
} 