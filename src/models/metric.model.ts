/**
 * Representa uma métrica financeira a ser exibida em um card no dashboard.
 * Usado para destacar indicadores chave de desempenho (KPIs).
 */
export interface Metric {
  /**
   * O título da métrica.
   * Ex: "Receita Total", "Despesas do Mês".
   */
  title: string;

  /**
   * O valor principal da métrica, formatado como string.
   * Ex: "R$ 15.000,00".
   */
  value: string;

  /**
   * A variação percentual ou absoluta da métrica em relação a um período anterior.
   * Ex: "+5.2%", "-R$ 200,00".
   * Esta propriedade é opcional.
   */
  change?: string;

  /**
   * Indica se a variação da métrica é positiva, negativa ou neutra.
   * Usado para aplicar estilos visuais (cores) ao valor da variação.
   */
  changeType: 'positive' | 'negative' | 'neutral';

  /**
   * O nome do ícone a ser exibido no card da métrica.
   * Ex: "monetization_on", "trending_up".
   */
  icon: string;

  /**
   * Uma breve descrição que explica o que a métrica representa.
   * Ex: "Soma de todas as receitas no período selecionado".
   */
  description: string;
}
