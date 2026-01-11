
/**
 * Representa uma meta financeira no sistema.
 */
export interface Goal {
  /**
   * O identificador único da meta.
   */
  id: string;

  /**
   * O nome ou descrição da meta.
   * Ex: "Aumentar faturamento em 20%", "Guardar para emergências".
   */
  name: string;

  /**
   * O tipo da meta.
   * - `revenue`: Meta relacionada ao aumento de faturamento.
   * - `savings`: Meta relacionada à economia de recursos.
   */
  type: 'revenue' | 'savings';

  /**
   * O valor alvo que se deseja alcançar com a meta.
   */
  targetAmount: number;

  /**
   * O prazo final para alcançar a meta, em formato de string ISO (ex: "2024-12-31T23:59:59.999Z").
   */
  deadline: string; // ISO string format
}
