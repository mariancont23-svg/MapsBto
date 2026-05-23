import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'fs';
import path from 'path';
import config from './config.js';

mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new DatabaseSync(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    phone        TEXT    UNIQUE NOT NULL,
    address      TEXT,
    category     TEXT,
    place_id     TEXT    UNIQUE,
    search_query TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function insertLead(lead) {
  return db
    .prepare(`INSERT OR IGNORE INTO leads (name, phone, address, category, place_id, search_query)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(lead.name, lead.phone, lead.address, lead.category, lead.place_id, lead.search_query);
}

export function getStats() {
  return db.prepare(`SELECT COUNT(*) as total FROM leads`).get();
}

export function clearLeads() {
  return db.prepare(`DELETE FROM leads`).run();
}

export default db;
