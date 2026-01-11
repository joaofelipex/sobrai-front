/**
 * Representa uma nota fiscal (ou fatura) emitida no sistema.
 */
export interface Invoice {
  /**
   * O identificador único da nota fiscal.
   */
  id: string;

  /**
   * O ID do cliente para o qual a nota fiscal foi emitida.
   * Relaciona-se com a interface `Client`.
   */
  clientId: string;

  /**
   * A descrição dos serviços prestados ou produtos vendidos.
   */
  description: string;

  /**
   * O valor bruto da nota fiscal, sem impostos.
   */
  amount: number;

  /**
   * O valor dos impostos incidentes sobre a nota fiscal.
   */
  taxAmount: number;

  /**
   * A data de emissão da nota fiscal, em formato de string ISO.
   */
  issueDate: string; // ISO string

  /**
   * O status atual da nota fiscal.
   * - `issued`: Emitida, aguardando pagamento.
   * - `paid`: Pagamento confirmado.
   * - `canceled`: Nota fiscal cancelada.
   */
  status: 'issued' | 'paid' | 'canceled';
}
