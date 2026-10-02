import { Moon, Sun } from "lucide-react";
import { useTheme } from "../app/theme";
import { BackupSection } from "./BackupSection";
import { Segmented, Sheet } from "./ui";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose(): void;
}) {
  const { dark, toggle } = useTheme();

  return (
    <Sheet open={open} onClose={onClose} title="Настройки">
      <div className="space-y-7">
        {/* Оформление */}
        <section>
          <h3 className="px-1 text-sm font-bold">Оформление</h3>
          <Segmented<"light" | "dark">
            className="mt-2"
            value={dark ? "dark" : "light"}
            onChange={(v) => {
              if ((v === "dark") !== dark) toggle();
            }}
            options={[
              {
                value: "light",
                label: (
                  <>
                    <Sun size={15} />
                    Светлая
                  </>
                ),
              },
              {
                value: "dark",
                label: (
                  <>
                    <Moon size={15} />
                    Тёмная
                  </>
                ),
              },
            ]}
          />
        </section>

        {/* Данные */}
        <section>
          <h3 className="px-1 text-sm font-bold">Данные и резервная копия</h3>
          <div className="mt-2">
            <BackupSection />
          </div>
        </section>

        <p className="px-1 text-[11px] leading-relaxed text-app-muted">
          Все данные хранятся только на этом телефоне и никуда не отправляются.
        </p>
      </div>
    </Sheet>
  );
}
