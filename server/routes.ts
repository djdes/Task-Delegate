import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Настройка загрузки файлов
const uploadsDir = path.join(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const taskId = req.params.id || "unknown";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `task-${taskId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Только изображения разрешены"));
    }
  },
});

// Расширяем типы для сессий
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Middleware для проверки авторизации
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  next();
}

// Middleware для проверки админских прав
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      // Нормализуем номер телефона
      const normalizedPhone = input.phone.replace(/\s+/g, "").replace(/-/g, "");
      
      const user = await storage.getUserByPhone(normalizedPhone);
      if (!user) {
        return res.status(401).json({
          message: "Пользователь с таким номером не найден",
          field: "phone",
        });
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error logging in:', err);
      res.status(500).json({ message: 'Ошибка авторизации', error: err.message });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.json(null);
      }
      
      const user = await storage.getUserById(req.session.userId);
      res.json(user || null);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  });

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
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      console.log("GET /api/tasks - tasks count:", tasks.length);
      tasks.forEach((task, index) => {
        console.log(`Task ${index + 1}: id=${task.id}, title=${task.title}, photoUrl=${task.photoUrl}, isCompleted=${task.isCompleted}`);
      });
      res.json(tasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ message: 'Ошибка загрузки задач', error: err.message });
    }
  });

  app.get(api.tasks.get.path, requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(Number(req.params.id));
      if (!task) {
        return res.status(404).json({ message: 'Задача не найдена' });
      }
      console.log("GET /api/tasks/:id - task:", task);
      res.json(task);
    } catch (err: any) {
      console.error('Error fetching task:', err);
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  });

  app.post(api.tasks.create.path, requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log("POST /api/tasks - req.body:", req.body);
      const input = api.tasks.create.input.parse(req.body);
      console.log("POST /api/tasks - parsed input:", input);
      const task = await storage.createTask(input);
      console.log("POST /api/tasks - created task:", task);
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

  app.put(api.tasks.update.path, requireAuth, requireAdmin, async (req, res) => {
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

  app.delete(api.tasks.delete.path, requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteTask(Number(req.params.id));
      res.status(204).send();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  });

  // Загрузка фото для задачи
  // Загрузка фото для задачи (оборачиваем multer, чтобы отдавать JSON даже при ошибках)
  app.post("/api/tasks/:id/photo", requireAuth, (req, res, next) => {
    // Устанавливаем заголовок Content-Type для JSON ответов
    res.setHeader('Content-Type', 'application/json');
    
    upload.single("photo")(req, res, async (err: any) => {
      try {
        if (err) {
          // Ошибки multer (например, неверный тип файла / размер)
          console.error("Multer upload error:", err);
          return res.status(400).json({ message: err.message || "Ошибка загрузки файла" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "Файл не загружен" });
        }

        const taskId = Number(req.params.id);
        const task = await storage.getTask(taskId);
        if (!task) {
          return res.status(404).json({ message: "Задача не найдена" });
        }

        // Проверяем права: исполнитель или админ
        const currentUser = await storage.getUserById(req.session.userId!);
        const isAllowed = currentUser?.isAdmin || task.workerId === req.session.userId;
        if (!isAllowed) {
          return res.status(403).json({ message: "Вы не являетесь исполнителем этой задачи" });
        }

        const photoUrl = `/uploads/${req.file.filename}`;
        console.log("Uploading photo for task:", taskId, "photoUrl:", photoUrl);
        const updatedTask = await storage.updateTask(taskId, { photoUrl });
        console.log("Updated task:", updatedTask);

        if (!updatedTask) {
          return res.status(500).json({ message: "Ошибка обновления задачи" });
        }

        return res.json({ photoUrl: updatedTask.photoUrl });
      } catch (uploadErr: any) {
        console.error("Error uploading photo:", uploadErr);
        return res.status(500).json({ message: "Ошибка загрузки фото", error: uploadErr.message });
      }
    });
  });

  // Удаление фото задачи
  app.delete("/api/tasks/:id/photo", requireAuth, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const taskId = Number(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Задача не найдена" });
      }

      // Проверяем права: исполнитель или админ
      const currentUser = await storage.getUserById(req.session.userId!);
      const isAllowed = currentUser?.isAdmin || task.workerId === req.session.userId;
      if (!isAllowed) {
        return res.status(403).json({ message: "Нет прав для удаления фото" });
      }

      if (!task.photoUrl) {
        return res.status(400).json({ message: "У задачи нет фото" });
      }

      // Удаляем файл с диска
      const { unlink } = await import("fs/promises");
      const photoPath = path.join(process.cwd(), task.photoUrl);
      try {
        await unlink(photoPath);
        console.log("Deleted photo file:", photoPath);
      } catch (unlinkErr: any) {
        console.error("Error deleting photo file:", unlinkErr);
        // Продолжаем даже если файл не удалился (возможно уже удален)
      }

      // Обновляем задачу, убирая photoUrl
      const updatedTask = await storage.updateTask(taskId, { photoUrl: null });
      if (!updatedTask) {
        return res.status(500).json({ message: "Ошибка обновления задачи" });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting photo:", err);
      res.status(500).json({ message: "Ошибка удаления фото", error: err.message });
    }
  });

  // Отметить задачу выполненной
  app.post(api.tasks.complete.path, requireAuth, async (req, res) => {
    try {
      const taskId = Number(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Задача не найдена" });
      }

      // Проверка прав: исполнитель или админ
      let isAllowed = false;
      if (req.session.userId === task.workerId) {
        isAllowed = true;
      } else {
        const currentUser = await storage.getUserById(req.session.userId!);
        if (currentUser?.isAdmin) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return res.status(403).json({ message: "Нет прав для изменения задачи" });
      }

      // Если требуется фото, проверяем что оно загружено
      if (task.requiresPhoto && !task.photoUrl) {
        return res.status(400).json({ message: "Необходимо загрузить фото перед завершением" });
      }

      const updatedTask = await storage.updateTask(taskId, { isCompleted: true });
      if (!updatedTask) {
        return res.status(500).json({ message: "Ошибка обновления задачи" });
      }

      res.json(updatedTask);
    } catch (err: any) {
      console.error("Error completing task:", err);
      res.status(500).json({ message: "Ошибка завершения задачи", error: err.message });
    }
  });

  // Отменить завершение задачи (любой авторизованный пользователь)
  app.post("/api/tasks/:id/uncomplete", requireAuth, async (req, res) => {
    try {
      const taskId = Number(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Задача не найдена" });
      }

      const updatedTask = await storage.updateTask(taskId, { isCompleted: false });
      if (!updatedTask) {
        return res.status(500).json({ message: "Ошибка обновления задачи" });
      }

      res.json(updatedTask);
    } catch (err: any) {
      console.error("Error uncompleting task:", err);
      res.status(500).json({ message: "Ошибка отмены завершения задачи", error: err.message });
    }
  });

  // Users
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Ошибка загрузки пользователей', error: err.message });
    }
  });

  app.post(api.users.create.path, requireAuth, requireAdmin, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      
      // Проверяем, существует ли пользователь
      const normalizedPhone = input.phone.replace(/\s+/g, "").replace(/-/g, "");
      const existingUser = await storage.getUserByPhone(normalizedPhone);
      if (existingUser) {
        return res.status(400).json({
          message: "Пользователь с таким номером уже существует",
          field: "phone",
        });
      }

      const user = await storage.createUser({
        ...input,
        phone: normalizedPhone,
        isAdmin: false, // Только админ может создавать пользователей, но не может создавать других админов через API
      });
      
      res.status(201).json(user);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating user:', err);
      res.status(500).json({ message: 'Ошибка создания пользователя', error: err.message });
    }
  });

  return httpServer;
}
