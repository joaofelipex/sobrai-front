/**
 * Representa uma dica ou insight gerado pela IA para o usuário.
 * São sugestões para melhorar a saúde financeira do negócio.
 */
export interface Insight {
  /**
   * O título do insight, resumindo a sugestão.
   * Ex: "Reduza despesas com fornecedores".
   */
  title: string;

  /**
   * A descrição detalhada do insight, explicando a sugestão e como aplicá-la.
   */
  description: string;

  /**
   * O nome do ícone (geralmente de uma biblioteca como Material Icons ou Font Awesome)
   * a ser exibido junto ao insight para representação visual.
   * Ex: "trending_down", "attach_money".
   */
  icon: string;

  /**
   * A prioridade do insight, indicando sua urgência ou importância.
   */
  priority: 'Alta prioridade' | 'Média prioridade' | 'Baixa prioridade';

  /**
   * O tipo de insight, categorizando a natureza da sugestão.
   * - `economy`: Sugestão focada em economia de custos.
   * - `cashflow`: Sugestão focada na melhoria do fluxo de caixa.
   * - `reminder`: Lembrete sobre pagamentos, recebimentos ou outras tarefas.
   */
  type: 'economy' | 'cashflow' | 'reminder';

  /**
   * Uma estimativa do impacto financeiro que a aplicação do insight pode gerar.
   * Ex: "Economia de R$ 200/mês", "Aumento de 5% no lucro".
   */
  estimatedImpact: string;
}
