import { workers, tasks, users, type Worker, type InsertWorker, type Task, type InsertTask, type User, type InsertUser, type UpdateUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  resetUserBalance(id: number): Promise<User | undefined>;

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

export class DatabaseStorage implements IStorage {
  async getUserByPhone(phone: string): Promise<User | undefined> {
    // Нормализуем номер телефона (убираем пробелы и дефисы)
    const normalizedPhone = phone.replace(/\s+/g, "").replace(/-/g, "");
    const [user] = await db.select().from(users).where(eq(users.phone, normalizedPhone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Нормализуем номер телефона
    const normalizedPhone = insertUser.phone.replace(/\s+/g, "").replace(/-/g, "");
    const [result] = await db.insert(users).values({
      ...insertUser,
      phone: normalizedPhone,
      createdAt: Math.floor(Date.now() / 1000),
    });
    const insertId = (result as any).insertId;
    const [user] = await db.select().from(users).where(eq(users.id, insertId));
    if (!user) throw new Error("Failed to create user");
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updateUser: UpdateUser): Promise<User | undefined> {
    const normalizedPhone = updateUser.phone.replace(/\s+/g, "").replace(/-/g, "");
    await db.update(users).set({
      phone: normalizedPhone,
      name: updateUser.name ?? null,
    }).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    if (!existingUser) return undefined;

    const newBalance = (existingUser.bonusBalance || 0) + amount;
    await db.update(users).set({ bonusBalance: newBalance }).where(eq(users.id, id));

    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async resetUserBalance(id: number): Promise<User | undefined> {
    await db.update(users).set({ bonusBalance: 0 }).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getWorkers(): Promise<Worker[]> {
    return await db.select().from(workers);
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const [result] = await db.insert(workers).values(insertWorker);
    const insertId = (result as any).insertId;
    const [worker] = await db.select().from(workers).where(eq(workers.id, insertId));
    return worker;
  }

  async updateWorker(id: number, insertWorker: InsertWorker): Promise<Worker | undefined> {
    await db.update(workers).set(insertWorker).where(eq(workers.id, id));
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async deleteWorker(id: number): Promise<void> {
    await db.delete(workers).where(eq(workers.id, id));
  }

  async getTasks(): Promise<Task[]> {
    const result = await db.select({
      id: tasks.id,
      title: tasks.title,
      workerId: tasks.workerId,
      requiresPhoto: tasks.requiresPhoto,
      photoUrl: tasks.photoUrl,
      photoUrls: tasks.photoUrls,
      examplePhotoUrl: tasks.examplePhotoUrl,
      isCompleted: tasks.isCompleted,
      weekDays: tasks.weekDays,
      monthDay: tasks.monthDay,
      isRecurring: tasks.isRecurring,
      price: tasks.price,
      category: tasks.category,
      description: tasks.description,
    }).from(tasks);
    // Парсим weekDays и photoUrls из JSON строки в массив
    return result.map(task => ({
      ...task,
      weekDays: task.weekDays ? JSON.parse(task.weekDays) : null,
      photoUrls: task.photoUrls ? JSON.parse(task.photoUrls) : [],
    })) as Task[];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select({
      id: tasks.id,
      title: tasks.title,
      workerId: tasks.workerId,
      requiresPhoto: tasks.requiresPhoto,
      photoUrl: tasks.photoUrl,
      photoUrls: tasks.photoUrls,
      examplePhotoUrl: tasks.examplePhotoUrl,
      isCompleted: tasks.isCompleted,
      weekDays: tasks.weekDays,
      monthDay: tasks.monthDay,
      isRecurring: tasks.isRecurring,
      price: tasks.price,
      category: tasks.category,
      description: tasks.description,
    }).from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    return {
      ...task,
      weekDays: task.weekDays ? JSON.parse(task.weekDays) : null,
      photoUrls: task.photoUrls ? JSON.parse(task.photoUrls) : [],
    } as Task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    // Сериализуем weekDays и photoUrls в JSON строку для хранения в БД
    const taskData = {
      ...insertTask,
      weekDays: insertTask.weekDays ? JSON.stringify(insertTask.weekDays) : null,
      photoUrls: insertTask.photoUrls ? JSON.stringify(insertTask.photoUrls) : null,
      monthDay: insertTask.monthDay ?? null,
      isRecurring: insertTask.isRecurring ?? true,
      price: insertTask.price ?? 0,
      category: insertTask.category ?? null,
      description: insertTask.description ?? null,
      examplePhotoUrl: insertTask.examplePhotoUrl ?? null,
    };
    const [result] = await db.insert(tasks).values(taskData as any);
    const insertId = (result as any).insertId;
    const [task] = await db.select({
      id: tasks.id,
      title: tasks.title,
      workerId: tasks.workerId,
      requiresPhoto: tasks.requiresPhoto,
      photoUrl: tasks.photoUrl,
      photoUrls: tasks.photoUrls,
      examplePhotoUrl: tasks.examplePhotoUrl,
      isCompleted: tasks.isCompleted,
      weekDays: tasks.weekDays,
      monthDay: tasks.monthDay,
      isRecurring: tasks.isRecurring,
      price: tasks.price,
      category: tasks.category,
      description: tasks.description,
    }).from(tasks).where(eq(tasks.id, insertId));
    return {
      ...task,
      weekDays: task.weekDays ? JSON.parse(task.weekDays) : null,
      photoUrls: task.photoUrls ? JSON.parse(task.photoUrls) : [],
    } as Task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    // Сериализуем weekDays и photoUrls если они переданы
    const updateData = {
      ...updates,
      weekDays: updates.weekDays !== undefined
        ? (updates.weekDays ? JSON.stringify(updates.weekDays) : null)
        : undefined,
      photoUrls: updates.photoUrls !== undefined
        ? (updates.photoUrls ? JSON.stringify(updates.photoUrls) : null)
        : undefined,
    };
    // Удаляем undefined поля
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    await db.update(tasks).set(updateData as any).where(eq(tasks.id, id));
    const [task] = await db.select({
      id: tasks.id,
      title: tasks.title,
      workerId: tasks.workerId,
      requiresPhoto: tasks.requiresPhoto,
      photoUrl: tasks.photoUrl,
      photoUrls: tasks.photoUrls,
      examplePhotoUrl: tasks.examplePhotoUrl,
      isCompleted: tasks.isCompleted,
      weekDays: tasks.weekDays,
      monthDay: tasks.monthDay,
      isRecurring: tasks.isRecurring,
      price: tasks.price,
      category: tasks.category,
      description: tasks.description,
    }).from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    return {
      ...task,
      weekDays: task.weekDays ? JSON.parse(task.weekDays) : null,
      photoUrls: task.photoUrls ? JSON.parse(task.photoUrls) : [],
    } as Task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
