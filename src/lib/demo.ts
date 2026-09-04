import type { ClassData, FundCollection, Kid } from "./types";
import { payKey, uid } from "./types";

const BOYS: [string, string][] = [
  ["Артём", "Смирнов"],
  ["Марк", "Иванов"],
  ["Лев", "Кузнецов"],
  ["Матвей", "Соколов"],
  ["Тимофей", "Попов"],
  ["Дмитрий", "Волков"],
  ["Арсений", "Петров"],
  ["Кирилл", "Михайлов"],
  ["Егор", "Новиков"],
  ["Иван", "Фёдоров"],
];

const GIRLS: [string, string][] = [
  ["София", "Васильева"],
  ["Мария", "Романова"],
  ["Анна", "Морозова"],
  ["Варвара", "Громова"],
  ["Ева", "Титова"],
  ["Ульяна", "Захарова"],
  ["Алиса", "Орлова"],
  ["Полина", "Киселёва"],
  ["Вероника", "Белова"],
];

const COLLECTIONS: { title: string; amount: number; date: string; description?: string; threshold: number }[] = [
  { title: "Шторы в класс", amount: 50_000, date: "2025-09-12", description: "Светлые рулонные шторы на все окна кабинета", threshold: 3 },
  { title: "Новогодний праздник", amount: 100_000, date: "2025-12-20", description: "Ёлка, угощение и подарки детям", threshold: 3 },
  { title: "Экскурсия в зоопарк", amount: 80_000, date: "2026-03-02", threshold: 4 },
  { title: "Рабочие тетради", amount: 35_000, date: "2026-04-01", threshold: 5 },
  { title: "Подарок учителю", amount: 60_000, date: "2026-05-15", description: "Цветы и подарочный сертификат", threshold: 2 },
];

const DAY = 24 * 60 * 60 * 1000;

export function buildDemoData(): ClassData {
  const kids: Kid[] = [
    ...BOYS.map(([firstName, lastName], i) => ({ id: uid(), firstName, lastName, gender: "boy" as const, createdAt: i })),
    ...GIRLS.map(([firstName, lastName], i) => ({ id: uid(), firstName, lastName, gender: "girl" as const, createdAt: 100 + i })),
  ];

  const collections: FundCollection[] = COLLECTIONS.map((c, j) => ({
    id: uid(),
    title: c.title,
    amount: c.amount,
    date: c.date,
    description: c.description,
    createdAt: 1000 + j,
  }));

  const payments: ClassData["payments"] = {};
  collections.forEach((collection, j) => {
    const base = Date.parse(`${collection.date}T12:00:00`);
    const threshold = COLLECTIONS[j].threshold;
    kids.forEach((kid, i) => {
      const paid = (i * 7 + j * 13) % 10 >= threshold;
      if (paid) {
        payments[payKey(kid.id, collection.id)] = {
          paidAt: base + (2 + ((i * 11 + j * 5) % 16)) * DAY + i * 60_000,
        };
      }
    });
  });

  return { kids, collections, payments };
}
