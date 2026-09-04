"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { UpdateManager } from "./pwa/UpdateManager";

function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-brand-400/25 blur-3xl dark:bg-brand-600/15" />
      <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/[0.07]" />
      <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl dark:bg-brand-800/10" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <BackgroundFX />
      <UpdateManager />
      <div className="relative mx-auto min-h-dvh w-full max-w-md sm:border-x sm:border-black/[0.04] sm:dark:border-white/[0.05]">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="safe-top px-4 pb-[calc(env(safe-area-inset-bottom,0px)+7.5rem)]"
        >
          {children}
        </motion.main>
      </div>
      <BottomNav />
    </>
  );
}
