import { getSupabase } from "./supabase";
import type { Worker, InsertWorker, Task, InsertTask } from "@shared/schema";

export interface IStorage {
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

export class SupabaseStorage implements IStorage {
  private get supabase() {
    return getSupabase();
  }

  async getWorkers(): Promise<Worker[]> {
    const { data, error } = await this.supabase
      .from('workers')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Supabase error getting workers:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    const { data, error } = await this.supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Supabase error getting worker:', error);
      return undefined;
    }
    return data;
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const { data, error } = await this.supabase
      .from('workers')
      .insert({ name: insertWorker.name })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating worker:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  async updateWorker(id: number, insertWorker: InsertWorker): Promise<Worker | undefined> {
    const { data, error } = await this.supabase
      .from('workers')
      .update({ name: insertWorker.name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating worker:', error);
      return undefined;
    }
    return data;
  }

  async deleteWorker(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('workers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting worker:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async getTasks(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Supabase error getting tasks:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return (data || []).map(task => ({
      id: task.id,
      title: task.title,
      workerId: task.worker_id
    }));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Supabase error getting task:', error);
      return undefined;
    }
    return {
      id: data.id,
      title: data.title,
      workerId: data.worker_id
    };
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({ 
        title: insertTask.title, 
        worker_id: insertTask.workerId || null 
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating task:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return {
      id: data.id,
      title: data.title,
      workerId: data.worker_id
    };
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const updateData: Record<string, any> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.workerId !== undefined) updateData.worker_id = updates.workerId;

    const { data, error } = await this.supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating task:', error);
      return undefined;
    }
    return {
      id: data.id,
      title: data.title,
      workerId: data.worker_id
    };
  }

  async deleteTask(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting task:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

export const storage = new SupabaseStorage();
