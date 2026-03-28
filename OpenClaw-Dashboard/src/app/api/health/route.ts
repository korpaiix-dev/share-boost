import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const healthPath = path.join(os.homedir(), 'PageContent', 'health_status.json');
    const reportPath = path.join(os.homedir(), 'PageContent', 'daily_report.json');

    let health = null;
    if (fs.existsSync(healthPath)) {
      health = JSON.parse(fs.readFileSync(healthPath, 'utf8'));
    }

    let dailyReport = null;
    if (fs.existsSync(reportPath)) {
      dailyReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }

    return NextResponse.json({ success: true, health, dailyReport });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
