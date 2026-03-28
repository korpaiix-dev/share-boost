import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ config ของ OpenClaw กรุณาตั้งค่า OpenClaw ก่อน' }, { status: 404 });
    }
    
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const token = configData?.gateway?.auth?.token;
    
    const messages = history || [];
    messages.push({ role: 'user', content: message });

    const openclawUrl = 'http://127.0.0.1:18789/v1/chat/completions';
    
    let response;
    try {
      response = await fetch(openclawUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: messages
        })
      });
    } catch (fetchError) {
      // Gateway is not running
      return NextResponse.json({ 
        success: false, 
        error: '⚠️ OpenClaw Gateway ไม่ได้เปิดอยู่! กรุณาเปิด Terminal แล้วพิมพ์ "openclaw" เพื่อเปิด Gateway ก่อนใช้งานแชท' 
      }, { status: 503 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw Gateway Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || '';

    // Log credits for chat usage
    try {
      const usage = data.usage || {};
      const tokensIn = usage.prompt_tokens || 0;
      const tokensOut = usage.completion_tokens || 0;
      const model = data.model || 'openrouter/auto';
      const costUsd = tokensIn * 0.15 / 1_000_000 + tokensOut * 0.6 / 1_000_000;
      
      const logPath = path.join(os.homedir(), 'PageContent', 'credit_log.json');
      const existing = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
      existing.push({
        timestamp: new Date().toISOString(),
        agent: 'agent-chat',
        action: `แชท: ${(message || '').substring(0, 50)}`,
        model,
        tokens_input: tokensIn,
        tokens_output: tokensOut,
        cost_usd: costUsd
      });
      fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
    } catch {}

    return NextResponse.json({ success: true, reply, history: [...messages, { role: 'assistant', content: reply }] });
    
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API Error:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
