import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

const dataDirectory = join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });
const database = new Database(join(dataDirectory, "abasto-dgo.sqlite"));

database.exec(`
  CREATE TABLE IF NOT EXISTS productores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    contactName TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL,
    products TEXT NOT NULL,
    retailPrice REAL NOT NULL,
    wholesalePrice REAL NOT NULL,
    capacity INTEGER NOT NULL,
    minimumOrder INTEGER NOT NULL,
    deliveryDays TEXT NOT NULL,
    deliveryTime TEXT NOT NULL,
    location TEXT NOT NULL,
    zone TEXT NOT NULL,
    photo TEXT,
    available INTEGER NOT NULL DEFAULT 1,
    rating REAL NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

export default database;
