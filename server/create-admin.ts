
import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    // Проверяем, существует ли уже админ
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (existingAdmin) {
      console.log("Админ уже существует!");
      return;
    }

    // Создаем админа с типовыми данными
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const admin = await storage.createAdmin({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "Администратор",
      role: "admin"
    });

    console.log("Админ успешно создан:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@example.com");
    
  } catch (error) {
    console.error("Ошибка при создании админа:", error);
  }
}

createAdmin();
