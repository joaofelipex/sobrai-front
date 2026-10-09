import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { LineChartComponent } from '../../shared/chart/line-chart.component';
import { BarChartComponent } from '../../shared/chart/bar-chart.component';

/**
 * Define os tipos de período de tempo para a análise financeira.
 */
type Period = 'month' | 'quarter' | 'year';

/**
 * Componente para a página de análise financeira.
 * Exibe gráficos e métricas detalhadas sobre as finanças do usuário,
 * permitindo a filtragem por período (mês, trimestre, ano).
 */
@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [CommonModule, LineChartComponent, BarChartComponent],
  templateUrl: './financial-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialAnalysisComponent {
  private transactionService = inject(TransactionService);

  /** Sinal (Signal) que armazena o período de tempo selecionado para a análise. */
  selectedPeriod = signal<Period>('month');

  /**
   * Sinal computado (Computed Signal) que filtra as transações com base no período selecionado.
   * @returns Um array de transações filtradas.
   */
  filteredTransactions = computed(() => {
    const all = this.transactionService.transactions();
    const now = new Date();
    let startDate: Date;

    switch (this.selectedPeriod()) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return all.filter(t => new Date(t.date) >= startDate);
  });

  /** Sinal computado que calcula a receita total para o período filtrado. */
  totalRevenue = computed(() => this.filteredTransactions().filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0));
  
  /** Sinal computado que calcula a despesa total para o período filtrado. */
  totalExpenses = computed(() => this.filteredTransactions().filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
  
  /** Sinal computado que calcula o lucro líquido (receitas - despesas) para o período filtrado. */
  netProfit = computed(() => this.totalRevenue() - this.totalExpenses());

  /**
   * Sinal computado que prepara os dados para o gráfico de barras de despesas por categoria.
   * Agrupa as despesas por categoria e as ordena da maior para a menor.
   * @returns Um array de objetos com `name` (categoria) e `value` (total).
   */
  expenseByCategoryChartData = computed(() => {
    const expenses = this.filteredTransactions().filter(t => t.type === 'expense');
    const categoryMap = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  });

  /**
   * Sinal computado que prepara os dados para o gráfico de linhas de Receitas vs. Despesas.
   * Agrupa as transações por dia (para visualização mensal/trimestral) ou por mês (para visualização anual)
   * e formata os dados para serem consumidos pelo componente de gráfico.
   * @returns Lista de pontos `{ name, Receita, Despesa }` para o gráfico de linhas.
   */
  revenueVsExpensesChartData = computed(() => {
    const transactions = this.filteredTransactions();
    const period = this.selectedPeriod();
    const formatLabel = (date: Date): string => {
      if (period === 'year') return date.toLocaleString('pt-BR', { month: 'short' });
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const dataMap = new Map<string, { revenue: number, expenses: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      // Agrupa por mês se a visualização for anual, caso contrário, por dia.
      const key = (period === 'year') 
        ? new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
        : date.toISOString().split('T')[0];

      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, expenses: 0 });
      }

      const entry = dataMap.get(key)!;
      if (t.type === 'revenue') {
        entry.revenue += t.amount;
      } else {
        entry.expenses += t.amount;
      }
    });

    const sortedKeys = Array.from(dataMap.keys()).sort();

    // Formato esperado por <app-line-chart>: uma linha por ponto, com uma chave por série.
    return sortedKeys.map(key => ({
      name: formatLabel(new Date(key)),
      Receita: dataMap.get(key)!.revenue,
      Despesa: dataMap.get(key)!.expenses,
    }));
  });

  /**
   * Define o período de tempo para a análise.
   * @param period O novo período a ser definido ('month', 'quarter', ou 'year').
   */
  setPeriod(period: Period) {
    this.selectedPeriod.set(period);
  }
}
