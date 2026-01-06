import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Workers
  app.get(api.workers.list.path, async (req, res) => {
    try {
      const workers = await storage.getWorkers();
      res.json(workers);
    } catch (err: any) {
      console.error('Error fetching workers:', err);
      res.status(500).json({ message: 'Ошибка загрузки сотрудников', error: err.message });
    }
  });

  app.get(api.workers.get.path, async (req, res) => {
    try {
      const worker = await storage.getWorker(Number(req.params.id));
      if (!worker) {
        return res.status(404).json({ message: 'Сотрудник не найден' });
      }
      res.json(worker);
    } catch (err: any) {
      console.error('Error fetching worker:', err);
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  });

  app.post(api.workers.create.path, async (req, res) => {
    try {
      const input = api.workers.create.input.parse(req.body);
      const worker = await storage.createWorker(input);
      res.status(201).json(worker);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating worker:', err);
      res.status(500).json({ message: 'Ошибка создания сотрудника', error: err.message });
    }
  });

  app.put(api.workers.update.path, async (req, res) => {
    try {
      const input = api.workers.update.input.parse(req.body);
      const worker = await storage.updateWorker(Number(req.params.id), input);
      if (!worker) {
        return res.status(404).json({ message: 'Сотрудник не найден' });
      }
      res.json(worker);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error updating worker:', err);
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  });

  app.delete(api.workers.delete.path, async (req, res) => {
    try {
      await storage.deleteWorker(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      console.error('Error deleting worker:', err);
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  });

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ message: 'Ошибка загрузки задач', error: err.message });
    }
  });

  app.get(api.tasks.get.path, async (req, res) => {
    try {
      const task = await storage.getTask(Number(req.params.id));
      if (!task) {
        return res.status(404).json({ message: 'Задача не найдена' });
      }
      res.json(task);
    } catch (err: any) {
      console.error('Error fetching task:', err);
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating task:', err);
      res.status(500).json({ message: 'Ошибка создания задачи', error: err.message });
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      if (!task) {
        return res.status(404).json({ message: 'Задача не найдена' });
      }
      res.json(task);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error updating task:', err);
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    try {
      await storage.deleteTask(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  });

  return httpServer;
}
