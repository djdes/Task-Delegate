import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createAdmin() {
  try {
    const adminPhone = "+79263740794"; // Нормализуем номер (убираем пробелы)
    
    // Проверяем, существует ли уже админ
    const [existing] = await db.select().from(users).where(eq(users.phone, adminPhone));
    
    if (existing) {
      console.log("Админ с номером", adminPhone, "уже существует");
      // Обновляем на админа, если не админ
      if (!existing.isAdmin) {
        await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
        console.log("Пользователь обновлен до администратора");
      }
      return;
    }

    // Создаем нового админа
    const [result] = await db.insert(users).values({
      phone: adminPhone,
      name: "Администратор",
      isAdmin: true,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const insertId = (result as any).insertId;
    console.log("Админ создан с ID:", insertId, "и номером:", adminPhone);
  } catch (error) {
    console.error("Ошибка при создании админа:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdmin();
