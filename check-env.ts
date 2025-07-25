import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Initialize environment variables
dotenv.config();

console.log('Environment variables:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Resolved database path: ${dbPath}`);
console.log(`Absolute path: ${path.resolve(dbPath)}`);

// Check if file exists
if (fs.existsSync(dbPath)) {
  console.log(`Database file exists at: ${dbPath}`);
  const stats = fs.statSync(dbPath);
  console.log(`File size: ${stats.size} bytes`);
} else {
  console.log(`Database file does not exist at: ${dbPath}`);
}