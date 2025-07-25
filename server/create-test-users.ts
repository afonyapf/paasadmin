
import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seed() {
  // Создание тестового админа
  const admin = await storage.getAdminByUsername("admin");
  if (!admin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createAdmin({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "Администратор",
      role: "admin"
    });
    console.log("Тестовый админ создан: admin/admin123");
  }
  // TODO: Добавить создание шаблонов, разделов, таблиц и других тестовых данных
}

seed().then(() => process.exit(0));
