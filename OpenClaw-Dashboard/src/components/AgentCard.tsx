'use client';
import { useState } from 'react';
import { BrainCircuit, Play, Square, Activity } from 'lucide-react';

export default function AgentCard({ agent }: { agent: any }) {
  const [status, setStatus] = useState(agent.status);
  const [isLoading, setIsLoading] = useState(false);

  const toggleStatus = async () => {
    setIsLoading(true);
    const targetStatus = status === 'หยุดการทำงาน' ? 'ว่าง' : 'หยุดการทำงาน';
    
    try {
      const res = await fetch('/api/agents/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.newStatus);
      }
    } catch (e) {
      alert('Error connecting to database');
    }
    setIsLoading(false);
  };

  const isStopped = status === 'หยุดการทำงาน';
  const isActive = status === 'ว่าง' || status === 'กำลังทำงาน';

  // Agent descriptions
  const getAgentDescription = (role: string) => {
    switch (role) {
      case 'Content Writer': return 'ดูแลการเขียนแคปชั่น โพสต์เนื้อหาสาระลง Facebook ให้อัตโนมัติ';
      case 'Scheduler': return 'จัดคิวงาน ช่วยจัดสรรเวลาโพสต์และดูความเหมาะสมของช่วงเวลา';
      case 'Analyst': return 'วิเคราะห์ภาพรวม สถิติคนดูและดึงข้อมูลจากหลังบ้านเพจ';
      case 'Responder': return 'เตรียมพร้อมรับมือแชทและคอมเมนต์ลูกเพจ';
      case 'Manager': return 'ดูแลภาพรวมทั้งหมด สั่งการแทนคุณเวลาที่ไม่ได้เฝ้าจอ';
      default: return 'ผู้ช่วย AI ส่วนตัว';
    }
  };

  return (
    <div className={`bg-slate-900 border ${isStopped ? 'border-rose-900/30 opacity-75 grayscale-[30%]' : 'border-slate-800'} rounded-2xl p-6 hover:border-slate-700 transition-all shadow-sm hover:shadow-xl group`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${agent.color}`}>
          {agent.avatar}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isStopped ? 'bg-rose-950/50 border-rose-900/50' : 'bg-slate-800 border-slate-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isStopped ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></div>
          <span className={`text-xs font-medium ${isStopped ? 'text-rose-400' : 'text-slate-300'}`}>{status}</span>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-white mb-1 transition-colors">{agent.name}</h2>
      <p className="text-indigo-400 text-sm mb-2 font-medium">{agent.role}</p>
      
      <p className="text-slate-400 text-xs mb-4 min-h-[40px] leading-relaxed">
        {getAgentDescription(agent.role)}
      </p>
      
      <div className="space-y-3 bg-slate-950/50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <BrainCircuit size={16} />
            <span>Model</span>
          </div>
          <span className="text-slate-300 font-mono text-xs max-w-[120px] truncate" title={agent.model}>
            {agent.model}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {isStopped ? (
          <button 
            onClick={toggleStatus}
            disabled={isLoading}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
          >
            {isLoading ? <span className="animate-pulse">กำลังเปลี่ยน...</span> : <><Play size={16} /> เปิดการทำงาน</>}
          </button>
        ) : (
          <button 
            onClick={toggleStatus}
            disabled={isLoading}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2.5 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
          >
            {isLoading ? <span className="animate-pulse">กำลังเปลี่ยน...</span> : <><Square size={16} /> หยุดชั่วคราว</>}
          </button>
        )}
      </div>
    </div>
  );
}
