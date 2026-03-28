import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CREDIT_LOG_PATH = path.join(os.homedir(), 'PageContent', 'credit_log.json');

interface CreditEntry {
  timestamp: string;
  agent: string;
  action: string;
  model: string;
  pageId?: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
}

function readCreditLog(): CreditEntry[] {
  if (!fs.existsSync(CREDIT_LOG_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(CREDIT_LOG_PATH, 'utf8')); }
  catch { return []; }
}

export async function GET() {
  try {
    const logs = readCreditLog();

    // Load page names from config
    const configPath = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
    const pageNames: Record<string, string> = {};
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const p of (config.pages || [])) {
          pageNames[p.id] = p.name;
        }
      } catch {}
    }

    // Summary by agent
    const agentSummary: Record<string, { totalCost: number; totalCalls: number; totalTokens: number }> = {};
    // Summary by page — pre-populate with ALL configured pages
    const pageSummary: Record<string, { pageId: string; pageName: string; totalCost: number; totalCalls: number; totalTokens: number }> = {};
    
    // Ensure every configured page appears even with 0 usage
    for (const [pid, pname] of Object.entries(pageNames)) {
      pageSummary[pid] = {
        pageId: pid,
        pageName: pname,
        totalCost: 0, totalCalls: 0, totalTokens: 0
      };
    }

    logs.forEach(entry => {
      // Agent summary
      if (!agentSummary[entry.agent]) {
        agentSummary[entry.agent] = { totalCost: 0, totalCalls: 0, totalTokens: 0 };
      }
      agentSummary[entry.agent].totalCost += entry.cost_usd;
      agentSummary[entry.agent].totalCalls += 1;
      agentSummary[entry.agent].totalTokens += (entry.tokens_input + entry.tokens_output);

      // Page summary
      const pid = entry.pageId || 'unknown';
      if (!pageSummary[pid]) {
        pageSummary[pid] = {
          pageId: pid,
          pageName: pageNames[pid] || (pid === 'unknown' ? 'ไม่ระบุเพจ' : pid),
          totalCost: 0, totalCalls: 0, totalTokens: 0
        };
      }
      pageSummary[pid].totalCost += entry.cost_usd;
      pageSummary[pid].totalCalls += 1;
      pageSummary[pid].totalTokens += (entry.tokens_input + entry.tokens_output);
    });

    // Get OpenRouter balance
    const authPath = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json');
    let balance = null;
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      const apiKey = authData?.profiles?.['openrouter:default']?.key;
      if (apiKey) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/credits', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (res.ok) {
            const data = await res.json();
            balance = data?.data?.total_credits ?? data?.data?.balance ?? null;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      logs: logs.slice(-100).reverse(),
      agentSummary,
      pageSummary,
      pageNames,
      balance,
      totalSpent: logs.reduce((sum, e) => sum + e.cost_usd, 0)
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const entry: CreditEntry = await req.json();
    const logs = readCreditLog();
    logs.push({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    fs.writeFileSync(CREDIT_LOG_PATH, JSON.stringify(logs, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
