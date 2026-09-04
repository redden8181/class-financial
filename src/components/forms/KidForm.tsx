"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CircleCheck, CircleX, Save, UserPlus } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import type { Gender } from "@/lib/types";
import { Button, cn, EmptyState, Field, genderStyle, LinkButton, Splash, TextInput } from "@/components/ui";
import { BackHeader } from "@/components/TopBar";

function MarsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9.5" cy="14.5" r="5.5" />
      <path d="M13.5 10.5 20 4" />
      <path d="M14.5 4H20v5.5" />
    </svg>
  );
}

function VenusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M12 14v7" />
      <path d="M8.5 17.5h7" />
    </svg>
  );
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "boy", label: "Мальчик" },
  { value: "girl", label: "Девочка" },
];

function GenderMark({ gender, className }: { gender: Gender; className?: string }) {
  return gender === "boy" ? <MarsIcon className={className} /> : <VenusIcon className={className} />;
}

export function KidForm({ kidId }: { kidId?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const kid = useClassStore((s) => s.kids.find((k) => k.id === kidId));
  const addKid = useClassStore((s) => s.addKid);
  const updateKid = useClassStore((s) => s.updateKid);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("boy");
  const [errors, setErrors] = useState<{ first?: string; last?: string }>({});
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (hydrated && kid && !filled) {
      setFirstName(kid.firstName);
      setLastName(kid.lastName);
      setGender(kid.gender);
      setFilled(true);
    }
  }, [hydrated, kid, filled]);

  if (!hydrated) return <Splash />;

  const editing = Boolean(kidId);

  if (editing && !kid) {
    return (
      <div>
        <BackHeader title="Изменить ребёнка" />
        <EmptyState icon={<CircleX size={28} strokeWidth={2.2} />} title="Ребёнок не найден" hint="Возможно, запись была удалена">
          <LinkButton href="/kids" full>
            К списку детей
          </LinkButton>
        </EmptyState>
      </div>
    );
  }

  const submit = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    const next: typeof errors = {};
    if (!first) next.first = "Введите имя";
    if (!last) next.last = "Введите фамилию";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing && kid) {
      updateKid(kid.id, { firstName: first, lastName: last, gender });
      router.replace(`/kid?id=${kid.id}`);
    } else {
      const created = addKid({ firstName: first, lastName: last, gender });
      router.replace(`/kid?id=${created.id}`);
    }
  };

  return (
    <div>
      <BackHeader title={editing ? "Изменить ребёнка" : "Новый ребёнок"} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 p-5">
          <Field label="Фамилия" error={errors.last}>
            <TextInput
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Иванов"
              autoComplete="off"
              maxLength={40}
            />
          </Field>

          <Field label="Имя" error={errors.first}>
            <TextInput
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
              autoComplete="off"
              maxLength={40}
            />
          </Field>

          <div>
            <span className="mb-1.5 block px-1 text-[13px] font-extrabold text-slate-500 dark:text-slate-400">Пол</span>
            <div className="grid grid-cols-2 gap-2.5">
              {GENDERS.map((g) => {
                const active = gender === g.value;
                const s = genderStyle(g.value);
                return (
                  <motion.button
                    key={g.value}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGender(g.value)}
                    className={cn(
                      "relative flex h-24 flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border-[1.5px] transition-colors",
                      active ? "border-transparent" : "border-black/[0.08] bg-white dark:border-white/10 dark:bg-white/[0.04]",
                    )}
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${g.value === "boy" ? "#38bdf8" : "#fb7185"}, ${g.value === "boy" ? "#2563eb" : "#db2777"})`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        active ? "bg-white/20 text-white" : cn(s.soft, s.text),
                      )}
                    >
                      <GenderMark gender={g.value} className="h-[19px] w-[19px]" />
                    </span>
                    <span className={cn("text-[14.5px] font-extrabold", active ? "text-white" : "text-slate-700 dark:text-slate-200")}>
                      {g.label}
                    </span>
                    {active && (
                      <span className="animate-pop absolute right-2.5 top-2.5 text-white/90">
                        <CircleCheck size={18} strokeWidth={2.8} />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <Button size="xl" full onClick={submit}>
          {editing ? <Save size={20} strokeWidth={2.6} /> : <UserPlus size={20} strokeWidth={2.6} />}
          {editing ? "Сохранить изменения" : "Добавить ребёнка"}
        </Button>
      </motion.div>
    </div>
  );
}
