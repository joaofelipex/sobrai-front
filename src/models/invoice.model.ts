export interface Invoice {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  taxAmount: number;
  issueDate: string; // ISO string
  status: 'issued' | 'paid' | 'canceled';
}
