import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../models/transaction.model';
import { LineChartComponent } from '../../shared/chart/line-chart.component';
import { BarChartComponent } from '../../shared/chart/bar-chart.component';

type Period = 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [CommonModule, LineChartComponent, BarChartComponent],
  templateUrl: './financial-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialAnalysisComponent {
  private transactionService = inject(TransactionService);

  selectedPeriod = signal<Period>('month');

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

  totalRevenue = computed(() => this.filteredTransactions().filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0));
  totalExpenses = computed(() => this.filteredTransactions().filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
  netProfit = computed(() => this.totalRevenue() - this.totalExpenses());

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

  revenueVsExpensesChartData = computed(() => {
    const transactions = this.filteredTransactions();
    const period = this.selectedPeriod();
    const formatLabel = (date: Date) => {
      if (period === 'year') return date.toLocaleString('default', { month: 'short' });
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const dataMap = new Map<string, { revenue: number, expenses: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
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

    const labels = sortedKeys.map(key => formatLabel(new Date(key)));
    const revenueData = sortedKeys.map(key => dataMap.get(key)!.revenue);
    const expensesData = sortedKeys.map(key => dataMap.get(key)!.expenses);

    return {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: revenueData,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
        },
        {
          label: 'Despesas',
          data: expensesData,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 1)',
        }
      ]
    };
  });

  setPeriod(period: Period) {
    this.selectedPeriod.set(period);
  }
}
