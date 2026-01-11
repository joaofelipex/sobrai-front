/**
 * Representa um plano de assinatura do serviço.
 */
export interface SubscriptionPlan {
  /**
   * O identificador único do plano.
   * - `starter`: Plano inicial, com recursos básicos.
   * - `growth`: Plano intermediário, com mais recursos.
   * - `pro`: Plano avançado, com todos os recursos.
   */
  id: 'starter' | 'growth' | 'pro';

  /**
   * O nome do plano de assinatura.
   * Ex: "Plano Starter".
   */
  name: string;

  /**
   * O preço mensal do plano.
   */
  price: number;

  /**
   * Uma lista das funcionalidades incluídas no plano.
   */
  features: string[];
}
