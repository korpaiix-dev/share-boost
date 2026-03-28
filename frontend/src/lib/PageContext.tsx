"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export interface PageInfo {
  id: string;
  name: string;
  emoji: string;
  status: "active" | "paused";
  platform: string;
  followers: number;
}

interface PageContextType {
  pages: PageInfo[];
  selectedPageId: string;
  setSelectedPageId: (id: string) => void;
  selectedPage: PageInfo | undefined;
  customerPackage: "standard" | "business" | "vip";
}

const mockPages: PageInfo[] = [
  {
    id: "page-1",
    name: "ร้านกาแฟ มิ้นท์",
    emoji: "☕",
    status: "active",
    platform: "Facebook",
    followers: 12450,
  },
  {
    id: "page-2",
    name: "MintCat Studio",
    emoji: "🐱",
    status: "active",
    platform: "Facebook",
    followers: 8320,
  },
  {
    id: "page-3",
    name: "ของดีราคาถูก",
    emoji: "🛍️",
    status: "paused",
    platform: "Facebook",
    followers: 3150,
  },
];

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [customerPackage, setCustomerPackage] = useState<"standard" | "business" | "vip">("vip");

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setPages(mockPages);
        setSelectedPageId(mockPages[0].id);
        return;
      }

      try {
        // ดึงข้อมูลเพจจาก API
        const apiPages = await apiFetch<Array<{
          id: number;
          page_name: string;
          status: string;
          fb_page_id: string;
        }>>("/customers/me/pages");

        if (apiPages && apiPages.length > 0) {
          const pageEmojis = ["📄", "🏪", "🛒", "💼", "🎯", "🌟", "📱", "🎨"];
          const mapped: PageInfo[] = apiPages.map((p, i) => ({
            id: String(p.id),
            name: p.page_name,
            emoji: pageEmojis[i % pageEmojis.length],
            status: (p.status === "active" ? "active" : "paused") as "active" | "paused",
            platform: "Facebook",
            followers: 0,
          }));
          setPages(mapped);
          setSelectedPageId(String(apiPages[0].id));
        } else {
          setPages(mockPages);
          setSelectedPageId(mockPages[0].id);
        }

        // ดึงข้อมูลโปรไฟล์เพื่อเอา package
        try {
          const profile = await apiFetch<{ package: string }>("/customers/me");
          if (profile?.package) {
            setCustomerPackage(profile.package as "standard" | "business" | "vip");
          }
        } catch {
          // ใช้ค่าเริ่มต้น
        }
      } catch {
        // API ไม่ตอบ — fallback mock
        setPages(mockPages);
        setSelectedPageId(mockPages[0].id);
      }
    };
    load();
  }, []);

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <PageContext.Provider
      value={{ pages, selectedPageId, setSelectedPageId, selectedPage, customerPackage }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext ต้องใช้ภายใน PageProvider");
  }
  return context;
}
