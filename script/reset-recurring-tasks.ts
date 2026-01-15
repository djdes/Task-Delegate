import "dotenv/config";
import mysql from "mysql2/promise";
import { unlink } from "fs/promises";
import path from "path";

/**
 * Скрипт для сброса повторяющихся задач.
 * Запускать ежедневно через cron/планировщик задач в начале дня (например, в 00:00 или 06:00).
 *
 * Что делает:
 * 1. Находит все задачи с is_recurring = 1 и is_completed = 1
 * 2. Сбрасывает is_completed в 0
 * 3. Удаляет фото (photo_url) и файлы с диска
 */

async function resetRecurringTasks() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error("MySQL credentials not set");
  }

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port: 3306,
  });

  try {
    // Находим все повторяющиеся завершенные задачи
    const [tasks] = await connection.execute<any[]>(`
      SELECT id, photo_url FROM tasks
      WHERE is_recurring = 1 AND is_completed = 1
    `);

    console.log(`Найдено ${tasks.length} повторяющихся завершенных задач для сброса`);

    // Удаляем файлы фотографий
    for (const task of tasks) {
      if (task.photo_url) {
        const photoPath = path.join(process.cwd(), task.photo_url);
        try {
          await unlink(photoPath);
          console.log(`Удален файл: ${photoPath}`);
        } catch (err: any) {
          // Файл может не существовать, это нормально
          if (err.code !== 'ENOENT') {
            console.error(`Ошибка удаления файла ${photoPath}:`, err.message);
          }
        }
      }
    }

    // Сбрасываем статус и фото для всех повторяющихся задач
    const [result] = await connection.execute(`
      UPDATE tasks
      SET is_completed = 0, photo_url = NULL
      WHERE is_recurring = 1 AND is_completed = 1
    `);

    const affectedRows = (result as any).affectedRows;
    console.log(`Сброшено задач: ${affectedRows}`);
    console.log("Сброс повторяющихся задач завершен");

  } catch (error) {
    console.error("Ошибка:", error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

resetRecurringTasks();
