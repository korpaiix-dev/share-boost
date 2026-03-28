import { dbAll } from '@/lib/db';
import { Bot, Activity, BrainCircuit } from 'lucide-react';
import AgentCard from '@/components/AgentCard';

export const revalidate = 0; // Disable caching to fetch real-time agent status

export default async function Home() {
  const agents = await dbAll('SELECT * FROM agents');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-end pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Agent Office</h1>
          <p className="text-slate-400">ควบคุมเปิด-ปิดการทำงานของ AI แต่ละตัวได้อย่างอิสระ</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent: any) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
