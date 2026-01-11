

/**
 * Representa uma transação financeira única (não recorrente).
 */
export interface Transaction {
  /**
   * O identificador único da transação.
   */
  id: string;

  /**
   * O tipo da transação.
   * - `revenue`: Uma entrada de dinheiro (receita).
   * - `expense`: Uma saída de dinheiro (despesa).
   */
  type: 'revenue' | 'expense';

  /**
   * A descrição da transação.
   * Ex: "Pagamento fornecedor X", "Recebimento projeto Y".
   */
  description: string;

  /**
   * O valor da transação.
   */
  amount: number;

  /**
   * A data em que a transação ocorreu, em formato de string ISO.
   */
  date: string; // ISO string

  /**
   * A categoria da transação.
   * Deve ser uma das opções definidas em `ExpenseCategories` ou `RevenueCategories`.
   */
  category: string;

  /**
   * O ID da nota fiscal associada a esta transação, se houver.
   * Relaciona-se com a interface `Invoice`.
   */
  invoiceId?: string; // Link to the invoice
}

/**
 * Lista de categorias de despesa pré-definidas.
 */
export const ExpenseCategories = [
  'Alimentação', 'Transporte', 'Moradia', 'Fornecedores',
  'Impostos', 'Marketing', 'Software', 'Outros'
];

/**
 * Lista de categorias de receita pré-definidas.
 */
export const RevenueCategories = [
  'Venda de Produto', 'Prestação de Serviço', 'Consultoria', 'Outros'
];
