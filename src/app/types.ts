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
  /** дата создания/события в формате yyyy-mm-dd */
  date: string;
  /** к какой дате нужно собрать деньги (yyyy-mm-dd), необязательно */
  deadline?: string;
  createdAt: number;
}

/** один частичный взнос */
export interface Contribution {
  id: string;
  amount: number;
  /** timestamp взноса */
  date: number;
}

export interface PaymentState {
  contributions: Contribution[];
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
