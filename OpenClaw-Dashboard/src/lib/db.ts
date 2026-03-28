import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'openclaw_dashboard.db');

export const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    avatar TEXT,
    color TEXT,
    status TEXT,
    model TEXT
  )`);

  db.get('SELECT count(*) as count FROM agents', (err, row: any) => {
    if (row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO agents VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run('agent-mint', 'น้องมิ้นท์', 'Content Writer', '🐱', 'bg-emerald-500', 'ว่าง', 'google/gemini-2.5-flash');
      stmt.run('agent-top', 'น้องท็อป', 'Scheduler', '🐶', 'bg-blue-500', 'ว่าง', 'deepseek/deepseek-r1:free');
      stmt.run('agent-fah', 'น้องฟ้า', 'Analyst', '🦊', 'bg-amber-500', 'ว่าง', 'openai/gpt-4o-mini');
      stmt.run('agent-pink', 'น้องพิ้งค์', 'Responder', '🐰', 'bg-rose-500', 'ว่าง', 'google/gemini-2.5-flash');
      stmt.run('agent-leo', 'พี่ลีโอ', 'Manager', '🦁', 'bg-orange-500', 'ว่าง', 'anthropic/claude-3.5-haiku');
      stmt.finalize();
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Helper for promise-based queries
export function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
