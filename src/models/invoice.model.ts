
export interface Invoice {
  id: string;
  clientName: string;
  clientDocument: string; // CPF or CNPJ
  description: string;
  amount: number;
  taxAmount: number;
  issueDate: string; // ISO string
  status: 'issued' | 'paid' | 'canceled';
}
