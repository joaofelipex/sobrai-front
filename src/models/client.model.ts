/**
 * Representa a estrutura de dados de um cliente no sistema.
 */
export interface Client {
  /**
   * O identificador único do cliente.
   */
  id: string;

  /**
   * O nome do cliente.
   */
  name: string;

  /**
   * O documento do cliente, que pode ser um CPF ou CNPJ.
   */
  document: string; // CPF or CNPJ
}
