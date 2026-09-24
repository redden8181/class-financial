export type Gender = "boy" | "girl";

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  createdAt: number;
}

export interface Collection {
  id: string;
  title: string;
  /** сумма с одного ребёнка, в рублях */
  amount: number;
  description?: string;
  /** дата в формате yyyy-mm-dd */
  date: string;
  createdAt: number;
}

export interface PaymentState {
  paid: boolean;
  /** timestamp оплаты */
  paidAt?: number;
}

/** payments[collectionId][childId] */
export type PaymentsMap = Record<string, Record<string, PaymentState>>;

export interface AppData {
  children: Child[];
  collections: Collection[];
  payments: PaymentsMap;
}

export const emptyData: AppData = {
  children: [],
  collections: [],
  payments: {},
};
