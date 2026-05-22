import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import path from 'path';
import config from './config.js';

mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT UNIQUE NOT NULL,
    address     TEXT,
    website     TEXT,
    category    TEXT,
    search_query TEXT,
    status      TEXT DEFAULT 'pending',
    message_sent TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at     DATETIME
  );

  CREATE TABLE IF NOT EXISTS searches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword     TEXT NOT NULL,
    location    TEXT NOT NULL,
    leads_found INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function insertLead(lead) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO leads (name, phone, address, website, category, search_query)
       VALUES (@name, @phone, @address, @website, @category, @search_query)`
    )
    .run(lead);
}

export function getPendingLeads(limit = 100, noWebsiteOnly = true) {
  const websiteFilter = noWebsiteOnly ? `AND (website IS NULL OR website = '')` : '';
  return db
    .prepare(`SELECT * FROM leads WHERE status = 'pending' ${websiteFilter} ORDER BY created_at ASC LIMIT ?`)
    .all(limit);
}

export function markLeadSent(id, message) {
  db.prepare(
    `UPDATE leads SET status = 'sent', message_sent = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(message, id);
}

export function markLeadFailed(id, reason) {
  db.prepare(`UPDATE leads SET status = 'failed', message_sent = ? WHERE id = ?`).run(
    reason || 'failed',
    id
  );
}

export function getAllLeads(limit = 50) {
  return db.prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT ?`).all(limit);
}

export function getStats() {
  return db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'sent'    THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN (website IS NULL OR website = '') THEN 1 ELSE 0 END) as no_website,
        SUM(CASE WHEN website != '' AND website IS NOT NULL THEN 1 ELSE 0 END) as has_website
       FROM leads`
    )
    .get();
}

export function resetLeads(all = false) {
  const where = all ? `status != 'pending'` : `status = 'failed'`;
  return db
    .prepare(`UPDATE leads SET status = 'pending', message_sent = NULL, sent_at = NULL WHERE ${where}`)
    .run();
}

export function clearLeads() {
  return db.prepare(`DELETE FROM leads`).run();
}

export function logSearch(keyword, location, leadsFound) {
  db.prepare(`INSERT INTO searches (keyword, location, leads_found) VALUES (?, ?, ?)`).run(
    keyword,
    location,
    leadsFound
  );
}

export default db;
