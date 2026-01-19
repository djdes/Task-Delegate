/**
 * Скрипт для добавления индексов в БД
 * Запуск: npx tsx script/add-indexes.ts
 */

import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addIndexes() {
  console.log("Adding database indexes...");

  try {
    // Индекс на tasks.workerId для быстрой фильтрации по исполнителю
    console.log("Creating index on tasks.worker_id...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id)
    `);

    // Индекс на tasks.isCompleted для быстрой фильтрации по статусу
    console.log("Creating index on tasks.is_completed...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed)
    `);

    // Составной индекс для частого запроса "все незавершенные задачи исполнителя"
    console.log("Creating composite index on tasks(worker_id, is_completed)...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_worker_completed ON tasks(worker_id, is_completed)
    `);

    // Индекс на tasks.isRecurring для ежедневного сброса задач
    console.log("Creating index on tasks.is_recurring...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring)
    `);

    // Индекс на users.phone для быстрого поиска при авторизации
    console.log("Creating index on users.phone...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)
    `);

    console.log("All indexes created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating indexes:", error);
    process.exit(1);
  }
}

addIndexes();
