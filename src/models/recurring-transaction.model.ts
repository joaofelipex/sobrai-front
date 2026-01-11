/**
 * Representa uma transação recorrente (receita ou despesa) no sistema.
 * Ex: Aluguel, salário, mensalidade de software.
 */
export interface RecurringTransaction {
  /**
   * O identificador único da transação recorrente.
   */
  id: string;

  /**
   * A descrição da transação.
   * Ex: "Assinatura Adobe Creative Cloud".
   */
  description: string;

  /**
   * O valor da transação.
   */
  amount: number;

  /**
   * O tipo da transação (receita ou despesa).
   */
  type: 'revenue' | 'expense';

  /**
   * A categoria na qual a transação se enquadra.
   * Ex: "Software", "Salários", "Marketing".
   */
  category: string;

  /**
   * A frequência com que a transação ocorre.
   * Atualmente, apenas 'monthly' (mensal) é suportado.
   */
  frequency: 'monthly';

  /**
   * A data de início da recorrência, em formato de string ISO.
   */
  startDate: string; // ISO string

  /**
   * A data do próximo vencimento da transação, em formato de string ISO.
   */
  nextDueDate: string; // ISO string

  /**
   * Indica se a transação recorrente está ativa ou não.
   * Uma transação inativa não gerará novas ocorrências.
   */
  isActive: boolean;
}
