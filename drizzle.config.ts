import { defineConfig } from "drizzle-kit";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
