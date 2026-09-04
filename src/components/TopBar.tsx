"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "./ui";

export function TabHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="truncate text-[27px] font-extrabold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm font-semibold text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>}
    </header>
  );
}

export function BackHeader({ title, actions, onBack }: { title: string; actions?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="mb-4 flex items-center gap-2.5 pt-1">
      <IconButton aria-label="Назад" onClick={() => (onBack ? onBack() : router.back())}>
        <ChevronLeft size={21} strokeWidth={2.6} />
      </IconButton>
      <h1 className="min-w-0 flex-1 truncate text-[19px] font-extrabold tracking-tight">{title}</h1>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
