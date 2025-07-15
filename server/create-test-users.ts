
import { storage } from "./storage";

async function createTestUsers() {
  try {
    const testUsers = [
      {
        username: "john_doe",
        email: "john@example.com",
        name: "John Doe",
        status: "active",
        plan: "free",
        avatar: null,
        oauthProvider: null,
        oauthId: null,
      },
      {
        username: "jane_smith",
        email: "jane@example.com", 
        name: "Jane Smith",
        status: "active",
        plan: "pro",
        avatar: null,
        oauthProvider: null,
        oauthId: null,
      },
      {
        username: "bob_wilson",
        email: "bob@example.com",
        name: "Bob Wilson", 
        status: "blocked",
        plan: "free",
        avatar: null,
        oauthProvider: null,
        oauthId: null,
      },
      {
        username: "alice_johnson",
        email: "alice@example.com",
        name: "Alice Johnson",
        status: "pending", 
        plan: "enterprise",
        avatar: null,
        oauthProvider: null,
        oauthId: null,
      },
    ];

    for (const userData of testUsers) {
      try {
        await storage.createUser(userData);
        console.log(`Пользователь ${userData.name} создан`);
      } catch (error) {
        console.log(`Пользователь ${userData.name} уже существует или ошибка:`, error);
      }
    }

    console.log("Тестовые пользователи созданы!");
  } catch (error) {
    console.error("Ошибка при создании тестовых пользователей:", error);
  }
}

createTestUsers();
