"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlowOrb({ className, tone = "violet" }: { className?: string; tone?: "violet" | "magenta" }) {
  const bg =
    tone === "violet"
      ? "radial-gradient(circle, var(--color-violet) 0%, transparent 70%)"
      : "radial-gradient(circle, var(--color-magenta) 0%, transparent 70%)";
  return <div className={cn("glow-orb", className)} style={{ background: bg }} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface/80 backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-violet-light to-violet text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_20px_-6px_rgba(112,48,239,0.6)] hover:brightness-110",
    secondary: "bg-surface-2 text-white border border-border hover:border-violet/50",
    ghost: "text-text-muted hover:text-white hover:bg-white/5",
    danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  };
  const sizes: Record<string, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3.5",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full rounded-2xl border border-border bg-surface p-6 shadow-2xl", maxWidth)}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      {icon && <div className="text-text-faint">{icon}</div>}
      <p className="font-medium text-white">{title}</p>
      {description && <p className="max-w-xs text-sm text-text-muted">{description}</p>}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2/80 px-3.5 py-2.5 text-sm text-white placeholder:text-text-faint outline-none transition-colors focus:border-violet",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2/80 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
