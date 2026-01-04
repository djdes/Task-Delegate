import { users, type User, type InsertUser, workers, type Worker, type InsertWorker, tasks, type Task, type InsertTask } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getWorkers(): Promise<Worker[]>;
  getWorker(id: number): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: number, worker: InsertWorker): Promise<Worker | undefined>;
  deleteWorker(id: number): Promise<void>;

  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workers: Map<number, Worker>;
  private tasks: Map<number, Task>;
  private currentWorkerId: number;
  private currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.workers = new Map();
    this.tasks = new Map();
    this.currentWorkerId = 1;
    this.currentTaskId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (this.users.size + 1).toString(); // Simple ID generation
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const id = this.currentWorkerId++;
    const worker: Worker = { ...insertWorker, id };
    this.workers.set(id, worker);
    return worker;
  }

  async updateWorker(id: number, insertWorker: InsertWorker): Promise<Worker | undefined> {
    if (!this.workers.has(id)) return undefined;
    const worker = { ...insertWorker, id };
    this.workers.set(id, worker);
    return worker;
  }

  async deleteWorker(id: number): Promise<void> {
    this.workers.delete(id);
    // Also optional: nullify workerId in tasks or delete tasks? 
    // For simplicity, let's keep tasks but set workerId to null if schema allowed it, 
    // but schema says integer("worker_id").references(...) which usually implies it might not be null if not specified.
    // In MemStorage we don't strictly enforce FKs unless we code it.
    // Let's just delete the worker.
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
