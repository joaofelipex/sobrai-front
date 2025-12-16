
export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  date: string; // ISO string
  category: string;
  invoiceId?: string; // Link to the invoice
}

export const ExpenseCategories = [
  'Alimentação', 'Transporte', 'Moradia', 'Fornecedores', 
  'Impostos', 'Marketing', 'Software', 'Outros'
];

export const RevenueCategories = [
  'Venda de Produto', 'Prestação de Serviço', 'Consultoria', 'Outros'
];
