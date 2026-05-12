export interface Task {
  id: number;
  title: string;
  time: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
  recurring?: boolean;
  repeatFrequency?: string;
}

export interface Bill {
  id: number;
  name: string;
  amount: string;
  dueDate: string;
  status: string;
  accountId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'Cash' | 'Bank' | 'Card' | 'Savings';
}

export interface Transaction {
  id: number;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  type: 'Expense' | 'Income';
  category: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface PersistedUserData {
  budget: number;
  tasks: Task[];
  bills: Bill[];
  loggedExpenses: Bill[];
  accounts: Account[];
  transactions: Transaction[];
}

export type PersistedUserDataInput = Partial<PersistedUserData> | null | undefined;

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  isLogin: boolean;
}

export interface LocalAccountRecord extends AppUser {
  passwordHash: string;
}
