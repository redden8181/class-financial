import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import {
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";

/* ------------------------------ Button ------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "soft";
  size?: "lg" | "md" | "sm";
  full?: boolean;
};

const buttonVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-[0_10px_24px_-10px_rgba(245,158,11,0.7)]",
  secondary: "border border-app-border bg-app-card text-app-text shadow-sm",
  soft: "bg-app-soft text-app-text",
  danger: "bg-rose-500 text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.6)]",
};

const buttonSizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  lg: "h-14 rounded-2xl text-base",
  md: "h-11 rounded-xl text-sm",
  sm: "h-9 rounded-lg px-3 text-xs",
};

export function Button({
  variant = "primary",
  size = "lg",
  full = true,
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 px-5 font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        full && "w-full",
        buttonSizes[size],
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

/* ---------------------------- IconButton ----------------------------- */

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-card text-app-muted shadow-sm transition-all duration-150 active:scale-90",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------ Progress ----------------------------- */

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-app-soft",
        className
      )}
    >
      <motion.div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500",
          barClassName
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
      />
    </div>
  );
}

/* ------------------------------ Segmented ---------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  small,
}: {
  value: T;
  onChange(v: T): void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  small?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex gap-1 rounded-full bg-app-soft p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-full font-semibold transition-colors",
              small ? "px-2 py-2 text-[11px]" : "px-3 py-2 text-sm",
              active ? "text-app-text" : "text-app-muted"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-app-card shadow-sm"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Sheet ------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="pb-safe relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-app-border bg-app-card shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
          >
            <div className="sticky top-0 z-10 border-b border-app-border/60 bg-app-card/95 px-5 pb-3 pt-3 backdrop-blur">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-app-border" />
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                <IconButton
                  onClick={onClose}
                  className="h-9 w-9 border-0 bg-app-soft"
                  aria-label="Закрыть"
                >
                  <X size={17} />
                </IconButton>
              </div>
            </div>
            <div className="px-5 pb-6 pt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- ConfirmSheet --------------------------- */

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel = "Удалить",
}: {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  title: string;
  text: string;
  confirmLabel?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-app-muted">{text}</p>
      <div className="mt-6 space-y-2.5">
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Sheet>
  );
}

/* ----------------------------- EmptyState ---------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center px-6 py-10 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300">
        <Icon size={30} strokeWidth={1.7} />
      </div>
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-[30ch] text-sm leading-relaxed text-app-muted">
        {text}
      </p>
      {action && <div className="mt-5 w-full">{action}</div>}
    </motion.div>
  );
}

/* ------------------------------ Section ------------------------------ */

export function SectionTitle({
  title,
  right,
  className,
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-1", className)}>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {right}
    </div>
  );
}
