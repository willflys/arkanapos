import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ARK-${y}${m}${d}-${rand}`;
}

export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  barista: "Barista",
  cashier: "Cashier",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  preparing: "Diproses",
  ready: "Siap Diantar",
  served: "Selesai Diantar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  preparing: "bg-violet/15 text-violet-light border-violet/30",
  ready: "bg-success/15 text-success border-success/30",
  served: "bg-white/10 text-text-muted border-white/10",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-danger/15 text-danger border-danger/30",
};
