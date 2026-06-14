import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'fs';
import path from 'path';
import config from './config.js';

mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new DatabaseSync(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL,
    phone               TEXT    UNIQUE NOT NULL,
    address             TEXT,
    category            TEXT,
    place_id            TEXT    UNIQUE,
    search_query        TEXT,
    status              TEXT    DEFAULT 'new',
    discord_message_id  TEXT,
    discord_channel_id  TEXT,
    queued_at           DATETIME,
    sent_at             DATETIME,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate existing tables that were created without the new columns
[
  "status TEXT DEFAULT 'new'",
  'discord_message_id TEXT',
  'discord_channel_id TEXT',
  'queued_at DATETIME',
  'sent_at DATETIME',
].forEach(col => {
  try { db.exec(`ALTER TABLE leads ADD COLUMN ${col}`); } catch {}
});

export function insertLead(lead) {
  return db
    .prepare(`INSERT OR IGNORE INTO leads (name, phone, address, category, place_id, search_query)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(lead.name, lead.phone, lead.address, lead.category, lead.place_id, lead.search_query);
}

export function setLeadMessageId(phone, messageId, channelId) {
  return db
    .prepare(`UPDATE leads SET discord_message_id=?, discord_channel_id=? WHERE phone=?`)
    .run(messageId, channelId, phone);
}

export function getLeadByMessageId(messageId) {
  return db.prepare(`SELECT * FROM leads WHERE discord_message_id=?`).get(messageId);
}

export function queueLead(phone) {
  return db
    .prepare(`UPDATE leads SET status='queued', queued_at=CURRENT_TIMESTAMP
              WHERE phone=? AND status NOT IN ('queued','sent')`)
    .run(phone);
}

export function skipLead(phone) {
  return db
    .prepare(`UPDATE leads SET status='skipped' WHERE phone=? AND status='new'`)
    .run(phone);
}

export function getNextQueued() {
  return db
    .prepare(`SELECT * FROM leads WHERE status='queued' ORDER BY queued_at ASC LIMIT 1`)
    .get();
}

export function markSent(phone) {
  return db
    .prepare(`UPDATE leads SET status='sent', sent_at=CURRENT_TIMESTAMP WHERE phone=?`)
    .run(phone);
}

export function markFailed(phone) {
  return db.prepare(`UPDATE leads SET status='failed' WHERE phone=?`).run(phone);
}

export function getQueueStats() {
  return db.prepare(`
    SELECT
      COUNT(CASE WHEN status='queued' THEN 1 END) as pending,
      COUNT(CASE WHEN status='sent'   THEN 1 END) as sent,
      COUNT(CASE WHEN status='failed' THEN 1 END) as failed,
      COUNT(*)                                     as total
    FROM leads
  `).get();
}

export function getStats() {
  return db.prepare(`SELECT COUNT(*) as total FROM leads`).get();
}

export function clearLeads() {
  return db.prepare(`DELETE FROM leads`).run();
}

export default db;
