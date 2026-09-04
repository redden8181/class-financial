export type Gender = "boy" | "girl";

export interface Kid {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  createdAt: number;
}

export interface FundCollection {
  id: string;
  title: string;
  /** сумма с одного ребёнка, в копейках (integer) */
  amount: number;
  description?: string;
  /** дата сбора, ISO "2026-09-12" */
  date: string;
  createdAt: number;
}

export interface PaymentRecord {
  /** метка времени оплаты */
  paidAt: number;
}

/** ключ `${kidId}::${collectionId}` -> запись об оплате */
export type PaymentsMap = Record<string, PaymentRecord>;

export interface ClassData {
  kids: Kid[];
  collections: FundCollection[];
  payments: PaymentsMap;
}

export const payKey = (kidId: string, collectionId: string) => `${kidId}::${collectionId}`;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
