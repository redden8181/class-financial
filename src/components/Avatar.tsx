import type { Child } from "../app/types";
import { cn } from "../utils/cn";

const sizeCls = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  child,
  size = "md",
  className,
}: {
  child: Child;
  size?: keyof typeof sizeCls;
  className?: string;
}) {
  const gradient =
    child.gender === "boy"
      ? "from-sky-400 to-blue-500 shadow-sky-500/25"
      : "from-rose-400 to-pink-500 shadow-rose-500/25";
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md",
        gradient,
        sizeCls[size],
        className
      )}
      aria-hidden
    >
      {(child.firstName[0] ?? "").toUpperCase()}
      {(child.lastName[0] ?? "").toUpperCase()}
    </div>
  );
}
