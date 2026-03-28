import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId') || 'main';

    // Load credentials from config
    let fbPageId = '', fbToken = '';
    const configPath = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const pageConfig = (config.pages || []).find((p: { id: string }) => p.id === pageId);
        if (pageConfig && pageConfig.accessToken) {
          fbPageId = pageConfig.pageId;
          fbToken = pageConfig.accessToken;
        }
      } catch {}
    }

    // Fallback to .env
    if (!fbToken) {
      const envContent = fs.readFileSync(path.join(os.homedir(), '.openclaw', '.env'), 'utf8');
      envContent.split(String.fromCharCode(10)).forEach(line => {
        const t = line.trim();
        if (t.startsWith('FACEBOOK_PAGE_ID=')) fbPageId = t.substring('FACEBOOK_PAGE_ID='.length).trim();
        if (t.startsWith('FACEBOOK_ACCESS_TOKEN=')) fbToken = t.substring('FACEBOOK_ACCESS_TOKEN='.length).trim();
      });
    }

    const url = `https://graph.facebook.com/v21.0/${fbPageId}/posts?fields=created_time,message,likes.summary(true),comments.summary(true),shares&limit=30&access_token=${fbToken}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Facebook data');
    
    const fbData = await res.json();
    const posts = fbData.data || [];

    let totalLikes = 0, totalComments = 0, totalShares = 0;

    const recentPosts = posts.slice(0, 10).map((p: { id: string; message?: string; created_time: string; likes?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } }; shares?: { count?: number } }) => {
      const likes = p.likes?.summary?.total_count || 0;
      const comments = p.comments?.summary?.total_count || 0;
      const shares = p.shares?.count || 0;
      totalLikes += likes; totalComments += comments; totalShares += shares;
      return { id: p.id, message: p.message || '', created_time: p.created_time, engagement: likes + comments + shares };
    });

    // Load daily report from น้องฟ้า
    let dailyReport = null;
    let dailyReportsHistory: { date: string; timestamp: string; pages?: { pageId: string; pageName: string; summary: string; insights: Record<string, unknown> }[] }[] = [];
    
    // Try combined report (new format with multi-page)
    const combinedReportPath = path.join(os.homedir(), 'PageContent', 'daily_report.json');
    if (fs.existsSync(combinedReportPath)) {
      try {
        const reportData = JSON.parse(fs.readFileSync(combinedReportPath, 'utf8'));
        // New format has "pages" array; old format has "insights" directly
        if (reportData.pages) {
          // Multi-page format: find the report for the selected page
          const pageReport = reportData.pages.find((p: { pageId: string }) => p.pageId === pageId);
          if (pageReport) {
            dailyReport = pageReport;
          }
        } else if (reportData.insights) {
          // Old single-page format
          dailyReport = reportData;
        }
      } catch {}
    }
    
    // Also try per-page report
    if (!dailyReport) {
      const perPagePath = path.join(os.homedir(), 'PageContent', `daily_report_${pageId}.json`);
      if (fs.existsSync(perPagePath)) {
        try { dailyReport = JSON.parse(fs.readFileSync(perPagePath, 'utf8')); } catch {}
      }
    }

    // Load report history
    const reportsPath = path.join(os.homedir(), 'PageContent', 'daily_reports.json');
    if (fs.existsSync(reportsPath)) {
      try { dailyReportsHistory = JSON.parse(fs.readFileSync(reportsPath, 'utf8')); } catch {}
    }

    return NextResponse.json({ 
      success: true, 
      stats: { totalPosts: posts.length, totalLikes, totalComments, totalShares },
      recentPosts,
      pageId,
      dailyReport,
      dailyReportsHistory
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
