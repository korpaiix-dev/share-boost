"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "customer" | "page";
  respondedBy: "ai" | "admin";
  time: string;
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  aiEnabled: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    name: "สมชาย ใจดี",
    avatar: "SC",
    lastMessage: "สนใจสินค้าตัวนี้ครับ ราคาเท่าไหร่?",
    lastTime: "10:32",
    unread: 3,
    aiEnabled: true,
    messages: [
      { id: 1, text: "สวัสดีครับ สนใจสินค้าตัวนี้", sender: "customer", respondedBy: "ai", time: "10:15" },
      { id: 2, text: "สวัสดีค่ะ ยินดีให้บริการเลยนะคะ สินค้าตัวไหนคะ?", sender: "page", respondedBy: "ai", time: "10:16" },
      { id: 3, text: "ตัวสีขาวครับ ไซส์ L มีไหม?", sender: "customer", respondedBy: "ai", time: "10:20" },
      { id: 4, text: "สีขาว ไซส์ L มีในสต็อคค่ะ ราคา 590 บาท รวมส่งฟรีเลยค่ะ", sender: "page", respondedBy: "ai", time: "10:21" },
      { id: 5, text: "สนใจสินค้าตัวนี้ครับ ราคาเท่าไหร่?", sender: "customer", respondedBy: "ai", time: "10:32" },
    ],
  },
  {
    id: 2,
    name: "นิดา รักสวย",
    avatar: "ND",
    lastMessage: "ส่งรูปเพิ่มได้ไหมคะ?",
    lastTime: "09:45",
    unread: 1,
    aiEnabled: true,
    messages: [
      { id: 1, text: "สวัสดีค่ะ มีชุดเดรสสีชมพูไหมคะ?", sender: "customer", respondedBy: "ai", time: "09:30" },
      { id: 2, text: "มีค่ะ มีหลายแบบเลยนะคะ ส่งรูปให้ดูเลยค่ะ", sender: "page", respondedBy: "ai", time: "09:31" },
      { id: 3, text: "แบบที่ 2 สวยมากเลย ราคาเท่าไหร่คะ?", sender: "customer", respondedBy: "ai", time: "09:38" },
      { id: 4, text: "แบบที่ 2 ราคา 890 บาทค่ะ ลดเหลือ 690 โปรวันนี้เท่านั้น!", sender: "page", respondedBy: "admin", time: "09:40" },
      { id: 5, text: "น่าสนใจค่ะ มีไซส์อะไรบ้าง?", sender: "customer", respondedBy: "ai", time: "09:42" },
      { id: 6, text: "ส่งรูปเพิ่มได้ไหมคะ?", sender: "customer", respondedBy: "ai", time: "09:45" },
    ],
  },
  {
    id: 3,
    name: "กิตติ ค้าขาย",
    avatar: "KT",
    lastMessage: "ขอบคุณครับ รอของนะ",
    lastTime: "เมื่อวาน",
    unread: 0,
    aiEnabled: false,
    messages: [
      { id: 1, text: "สั่งของแล้วครับ ออเดอร์ #1234", sender: "customer", respondedBy: "ai", time: "14:00" },
      { id: 2, text: "ได้รับออเดอร์แล้วค่ะ จัดส่งภายในวันนี้นะคะ", sender: "page", respondedBy: "ai", time: "14:02" },
      { id: 3, text: "ส่ง Kerry หรือ Flash ครับ?", sender: "customer", respondedBy: "ai", time: "14:10" },
      { id: 4, text: "ส่ง Kerry Express ค่ะ จะได้เลขพัสดุภายในวันนี้เลยนะคะ", sender: "page", respondedBy: "admin", time: "14:15" },
      { id: 5, text: "ขอบคุณครับ รอของนะ", sender: "customer", respondedBy: "ai", time: "14:20" },
    ],
  },
  {
    id: 4,
    name: "แพร พิมพ์ใจ",
    avatar: "PP",
    lastMessage: "อยากได้สีม่วงค่ะ",
    lastTime: "เมื่อวาน",
    unread: 2,
    aiEnabled: true,
    messages: [
      { id: 1, text: "มีกระเป๋าใบนี้สีอื่นไหมคะ?", sender: "customer", respondedBy: "ai", time: "16:00" },
      { id: 2, text: "มีค่ะ มีสีดำ ขาว น้ำตาล และชมพูค่ะ", sender: "page", respondedBy: "ai", time: "16:01" },
      { id: 3, text: "สีม่วงไม่มีเหรอคะ?", sender: "customer", respondedBy: "ai", time: "16:05" },
      { id: 4, text: "ขออภัยค่ะ ตอนนี้ยังไม่มีสีม่วง แต่จะมาเพิ่มเร็วๆ นี้ค่ะ", sender: "page", respondedBy: "ai", time: "16:06" },
      { id: 5, text: "อยากได้สีม่วงค่ะ", sender: "customer", respondedBy: "ai", time: "16:10" },
    ],
  },
  {
    id: 5,
    name: "วรรณา ช้อปปิ้ง",
    avatar: "WN",
    lastMessage: "โอนเงินแล้วค่ะ ส่งสลิปให้นะ",
    lastTime: "2 วันก่อน",
    unread: 0,
    aiEnabled: true,
    messages: [
      { id: 1, text: "สนใจสินค้า 3 ชิ้นค่ะ ลดได้ไหม?", sender: "customer", respondedBy: "ai", time: "11:00" },
      { id: 2, text: "ซื้อ 3 ชิ้นลดให้ 10% เลยค่ะ", sender: "page", respondedBy: "admin", time: "11:05" },
      { id: 3, text: "ตกลงค่ะ จะโอนเงินเลย", sender: "customer", respondedBy: "ai", time: "11:10" },
      { id: 4, text: "รบกวนโอนมาที่บัญชีนี้นะคะ: กสิกร 123-456-7890", sender: "page", respondedBy: "admin", time: "11:12" },
      { id: 5, text: "โอนเงินแล้วค่ะ ส่งสลิปให้นะ", sender: "customer", respondedBy: "ai", time: "11:20" },
      { id: 6, text: "ได้รับเรียบร้อยค่ะ ขอบคุณมากนะคะ จัดส่งภายในวันนี้เลยค่ะ", sender: "page", respondedBy: "ai", time: "11:25" },
    ],
  },
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [inputText, setInputText] = useState("");
  const [searchText, setSearchText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId)!;

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      text: inputText,
      sender: "page",
      respondedBy: "admin",
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: inputText, lastTime: "ตอนนี้" }
          : c
      )
    );
    setInputText("");
  };

  const toggleAI = (id: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, aiEnabled: !c.aiEnabled } : c))
    );
  };

  const handleSelectConversation = (id: number) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Left: Conversation List */}
      <div className="w-[30%] min-w-[280px] flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            แชท Messenger
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
                selectedId === conv.id ? "bg-indigo-500/10 border-r-2 border-indigo-500" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">{conv.name}</span>
                  <span className="text-[11px] text-slate-500 flex-shrink-0 ml-2">{conv.lastTime}</span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {selected.avatar}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{selected.name}</h3>
              <p className="text-[11px] text-slate-400">{selected.messages.length} ข้อความ</p>
            </div>
          </div>
          <button
            onClick={() => toggleAI(selected.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selected.aiEnabled
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
            }`}
          >
            {selected.aiEnabled ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            AI ตอบอัตโนมัติ {selected.aiEnabled ? "เปิด" : "ปิด"}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {selected.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "page" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] ${msg.sender === "page" ? "order-1" : ""}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "page"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-md"
                      : "bg-white/10 text-slate-200 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
                <div
                  className={`flex items-center gap-1.5 mt-1 ${
                    msg.sender === "page" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className="text-[10px] text-slate-500">{msg.time}</span>
                  {msg.sender === "page" && (
                    <span className="text-[10px] text-slate-500">
                      {msg.respondedBy === "ai" ? "🤖 AI" : "👤 แอดมิน"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="พิมพ์ข้อความตอบกลับ (แทนที่ AI)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
