"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { CircleCheck, PiggyBank, CircleX } from "lucide-react";
import type { Gender, Kid } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------ Buttons ------------------------------ */

type ButtonVariant = "primary" | "secondary" | "outline" | "soft" | "danger";
type ButtonSize = "md" | "lg" | "xl";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-brand font-bold hover:brightness-105",
  secondary: "bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold hover:bg-brand-500/15",
  outline:
    "border-[1.5px] border-black/10 dark:border-white/12 bg-white/70 dark:bg-white/5 font-bold text-slate-800 dark:text-slate-100",
  soft: "bg-slate-900/[0.05] dark:bg-white/[0.07] font-bold text-slate-700 dark:text-slate-200",
  danger: "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "h-11 px-4 rounded-2xl text-sm gap-2",
  lg: "h-[52px] px-5 rounded-[1.15rem] text-[15px] gap-2.5",
  xl: "h-14 px-6 rounded-[1.35rem] text-base gap-2.5",
};

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

export function Button({ variant = "primary", size = "lg", full, className, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex select-none items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-45",
        buttonVariants[variant],
        buttonSizes[size],
        full && "w-full",
        className,
      )}
      {...rest}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "lg",
  full,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} className={full ? "w-full" : undefined}>
      <Link
        href={href}
        className={cn(
          "inline-flex select-none items-center justify-center transition-colors",
          buttonVariants[variant],
          buttonSizes[size],
          full && "w-full",
          className,
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function IconButton({
  className,
  danger,
  ...rest
}: HTMLMotionProps<"button"> & { danger?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
        danger
          ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
          : "bg-slate-900/[0.05] text-slate-600 dark:bg-white/[0.07] dark:text-slate-300",
        className,
      )}
      {...rest}
    />
  );
}

export function LinkIconButton({
  href,
  className,
  children,
  danger,
  label,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  danger?: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
        danger
          ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
          : "bg-slate-900/[0.05] text-slate-600 dark:bg-white/[0.07] dark:text-slate-300",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------ Avatar ------------------------------ */

const GENDER_STYLES: Record<Gender, { avatar: string; soft: string; text: string; dot: string }> = {
  boy: {
    avatar: "from-sky-400 to-blue-600",
    soft: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  girl: {
    avatar: "from-rose-400 to-pink-600",
    soft: "bg-rose-500/10",
    text: "text-rose-500 dark:text-rose-400",
    dot: "bg-rose-500",
  },
};

export function genderStyle(gender: Gender) {
  return GENDER_STYLES[gender];
}

const AVATAR_SIZES = { sm: "h-9 w-9 text-[13px] rounded-xl", md: "h-11 w-11 text-[15px] rounded-2xl", lg: "h-16 w-16 text-[22px] rounded-[1.35rem]" } as const;

export function Avatar({
  kid,
  size = "md",
  className,
}: {
  kid: Pick<Kid, "firstName" | "lastName" | "gender">;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-extrabold uppercase text-white",
        GENDER_STYLES[kid.gender].avatar,
        AVATAR_SIZES[size],
        className,
      )}
    >
      {kid.firstName[0]}
      {kid.lastName[0]}
    </div>
  );
}

export function GenderChip({ gender }: { gender: Gender }) {
  const s = GENDER_STYLES[gender];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", s.soft, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {gender === "boy" ? "Мальчик" : "Девочка"}
    </span>
  );
}

/* ------------------------------ Status chip ------------------------------ */

export function StatusChip({ paid, small }: { paid: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center gap-1.5 rounded-full border font-bold",
        small ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-[13px]",
        paid
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-400",
      )}
    >
      {paid ? <CircleCheck size={small ? 14 : 16} strokeWidth={2.6} /> : <CircleX size={small ? 14 : 16} strokeWidth={2.6} />}
      {paid ? "Сдал" : "Не сдал"}
    </span>
  );
}

/* ------------------------------ Progress ------------------------------ */

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: "brand" | "emerald" | "light";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full",
        tone === "light" ? "bg-white/20" : "bg-slate-900/[0.07] dark:bg-white/10",
        className,
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className={cn(
          "relative h-full overflow-hidden rounded-full",
          tone === "emerald" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : tone === "light" ? "bg-white" : "bg-gradient-to-r from-brand-400 to-brand-600",
        )}
      >
        <span className="animate-shine absolute inset-y-0 w-8 skew-x-[-20deg] bg-white/40 blur-[2px]" />
      </motion.div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 116,
  stroke = 11,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-slate-900/[0.07] dark:stroke-white/10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          stroke="url(#ringGrad)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2={size} y2={size}>
            <stop offset="0%" stopColor="#8b8bf8" />
            <stop offset="100%" stopColor="#5b48ea" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold tabular-nums tracking-tight">{pct}%</span>
        <span className="text-[11px] font-bold text-slate-400">собрано</span>
      </div>
    </div>
  );
}

/* ------------------------------ Titles & rows ------------------------------ */

export function SectionTitle({
  children,
  count,
  dotClass,
  action,
}: {
  children: ReactNode;
  count?: number;
  dotClass?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 mt-6 flex items-center gap-2 px-1 first:mt-0">
      {dotClass && <span className={cn("h-2 w-2 rounded-full", dotClass)} />}
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{children}</h2>
      {typeof count === "number" && (
        <span className="rounded-full bg-slate-900/[0.05] px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/[0.07] dark:text-slate-400">
          {count}
        </span>
      )}
      <div className="ml-auto">{action}</div>
    </div>
  );
}

/* ------------------------------ Forms ------------------------------ */

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[13px] font-extrabold text-slate-500 dark:text-slate-400">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block px-1 text-xs font-semibold text-rose-500">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block px-1 text-xs font-medium text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  "h-14 w-full rounded-[1.15rem] border-[1.5px] border-black/[0.08] bg-white px-4 text-base font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(inputBase, className)} {...rest} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-[96px] resize-none py-3.5 leading-relaxed", className)}
      {...rest}
    />
  );
});

/* ------------------------------ Misc ------------------------------ */

export function EmptyState({
  icon,
  title,
  hint,
  children,
  tone = "brand",
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  children?: ReactNode;
  tone?: "brand" | "emerald";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center px-6 py-10 text-center"
    >
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem]",
          tone === "emerald" ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-500/10 text-brand-500",
        )}
      >
        {icon}
      </div>
      <p className="text-lg font-extrabold">{title}</p>
      {hint && <p className="mt-1.5 max-w-[26ch] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
      {children && <div className="mt-5 flex w-full flex-col gap-2.5">{children}</div>}
    </motion.div>
  );
}

export function Splash() {
  return (
    <div className="flex min-h-[55dvh] flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-brand"
      >
        <PiggyBank size={30} strokeWidth={2.2} />
      </motion.div>
      <p className="text-sm font-bold text-slate-400">Загружаю кассу…</p>
    </div>
  );
}

export function MoneyValue({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums tracking-tight", className)}>{formatMoney(value)}</span>;
}
