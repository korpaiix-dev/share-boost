import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });

    const dbPath = path.resolve(process.cwd(), 'openclaw_dashboard.db');
    
    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      db.run('UPDATE agents SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) reject(err);
        else {
          db.run('INSERT INTO logs (agent_id, action) VALUES (?, ?)', [id, `ถูกเปลี่ยนสถานะเป็น: ${status}`], (err2) => {
            db.close();
            if (err2) reject(err2); else resolve(this.changes);
          });
        }
      });
    });

    return NextResponse.json({ success: true, newStatus: status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
