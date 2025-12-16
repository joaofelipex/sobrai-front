export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  frequency: 'monthly';
  startDate: string; // ISO string
  nextDueDate: string; // ISO string
  isActive: boolean;
}
