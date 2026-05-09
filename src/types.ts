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
}
