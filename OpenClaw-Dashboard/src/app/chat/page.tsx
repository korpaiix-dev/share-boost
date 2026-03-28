'use client';
import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: currentMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMsg, history: messages })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(data.history);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error to local API' }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      <header className="pb-4 border-b border-slate-800 shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">แชท (OpenClaw)</h1>
        <p className="text-slate-400">สนทนากับ Gateway ผ่าน HTTP Proxy API</p>
      </header>
      
      <div className="flex-1 overflow-y-auto mb-4 mt-6 space-y-6 pr-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
            <Bot size={48} className="opacity-20" />
            <p>พิมพ์ข้อความเพื่อเริ่มสนทนากับ OpenClaw 🦞</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-emerald-400" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-md bg-slate-700">
              <Bot size={20} className="text-emerald-400 animate-pulse" />
            </div>
            <div className="bg-slate-800 text-slate-400 border border-slate-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="relative mt-auto shrink-0 shrink">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความคำสั่ง..." 
          disabled={isLoading}
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white w-12 rounded-lg flex items-center justify-center transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
