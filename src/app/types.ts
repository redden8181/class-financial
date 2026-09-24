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

/** трата из собранных денег */
export interface Expense {
  id: string;
  /** на что потратили: «Рабочие тетради» */
  title: string;
  amount: number;
  /** дата траты в формате yyyy-mm-dd */
  date: string;
  note?: string;
  /** ключ фотографии чека в IndexedDB */
  photoId?: string;
  createdAt: number;
}

/** expenses[collectionId] */
export type ExpensesMap = Record<string, Expense[]>;

export interface AppData {
  children: Child[];
  collections: Collection[];
  payments: PaymentsMap;
  expenses: ExpensesMap;
}

export const emptyData: AppData = {
  children: [],
  collections: [],
  payments: {},
  expenses: {},
};
