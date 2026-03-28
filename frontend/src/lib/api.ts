const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://139.59.123.146:8000/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000); // 3 วินาที timeout
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch {
    clearTimeout(timeout);
    throw new Error("API not available");
  }
}

export function getApiBase(): string {
  return API_BASE;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("th-TH").format(n);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
