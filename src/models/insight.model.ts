export interface Insight {
  title: string;
  description: string;
  icon: string;
  priority: 'Alta prioridade' | 'Média prioridade' | 'Baixa prioridade';
  type: 'economy' | 'cashflow' | 'reminder';
  estimatedImpact: string;
}
