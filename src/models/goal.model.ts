
export interface Goal {
  id: string;
  name: string;
  type: 'revenue' | 'savings';
  targetAmount: number;
  deadline: string; // ISO string format
}
