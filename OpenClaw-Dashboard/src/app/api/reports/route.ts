import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId') || 'all';

    // Load daily report (latest)
    let dailyReport = null;
    const combinedReportPath = path.join(os.homedir(), 'PageContent', 'daily_report.json');
    if (fs.existsSync(combinedReportPath)) {
      try {
        const reportData = JSON.parse(fs.readFileSync(combinedReportPath, 'utf8'));
        if (reportData.pages) {
          // Multi-page format
          if (pageId === 'all') {
            dailyReport = reportData;
          } else {
            const pageReport = reportData.pages.find((p: { pageId: string }) => p.pageId === pageId);
            if (pageReport) {
              dailyReport = { ...reportData, pages: [pageReport] };
            }
          }
        } else if (reportData.insights) {
          // Old single-page format
          dailyReport = { date: reportData.date, timestamp: reportData.timestamp, pages: [reportData] };
        }
      } catch {}
    }

    // Also check per-page report if no combined
    if (!dailyReport && pageId !== 'all') {
      const perPagePath = path.join(os.homedir(), 'PageContent', `daily_report_${pageId}.json`);
      if (fs.existsSync(perPagePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(perPagePath, 'utf8'));
          dailyReport = { date: data.date, timestamp: data.timestamp, pages: [data] };
        } catch {}
      }
    }

    // Load report history (up to 30 days)
    let history: unknown[] = [];
    const reportsPath = path.join(os.homedir(), 'PageContent', 'daily_reports.json');
    if (fs.existsSync(reportsPath)) {
      try { history = JSON.parse(fs.readFileSync(reportsPath, 'utf8')); } catch {}
    }

    // Load page names
    const pageNames: Record<string, string> = {};
    const configPath = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const p of (config.pages || [])) {
          pageNames[p.id] = p.name;
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      dailyReport,
      history,
      pageNames
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
