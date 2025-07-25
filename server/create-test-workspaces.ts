
import { storage } from "./storage";

async function createTestWorkspaces() {
  try {
    const testWorkspaces = [
      {
        name: "John's Portfolio",
        description: "Personal portfolio website",
        ownerId: 1, // john_doe
        status: "active",
        templateId: null,
        settings: { theme: "dark" },
      },
      {
        name: "Jane's Blog", 
        description: "Tech blog and tutorials",
        ownerId: 2, // jane_smith
        status: "active",
        templateId: null,
        settings: { theme: "light" },
      },
      {
        name: "Bob's Store",
        description: "E-commerce website",
        ownerId: 3, // bob_wilson
        status: "suspended",
        templateId: null,
        settings: { currency: "USD" },
      },
      {
        name: "Alice's Dashboard",
        description: "Analytics dashboard",
        ownerId: 4, // alice_johnson
        status: "active",
        templateId: null,
        settings: { refreshInterval: 30 },
      },
    ];

    for (const workspaceData of testWorkspaces) {
      try {
        await storage.createWorkspace(workspaceData);
        console.log(`Workspace ${workspaceData.name} создан`);
      } catch (error) {
        console.log(`Workspace ${workspaceData.name} уже существует или ошибка:`, error);
      }
    }

    console.log("Тестовые workspace'ы созданы!");
  } catch (error) {
    console.error("Ошибка при создании тестовых workspace'ов:", error);
  }
}

createTestWorkspaces();
