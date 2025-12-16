
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { InvoiceService } from '../../../services/invoice.service';
import { Transaction } from '../../../models/transaction.model';
import { BarChartComponent } from '../../shared/chart/bar-chart.component';
import { LineChartComponent } from '../../shared/chart/line-chart.component';

type Period = 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BarChartComponent, LineChartComponent],
  providers: [DatePipe],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  transactionService = inject(TransactionService);
  invoiceService = inject(InvoiceService);
  datePipe = inject(DatePipe);

  selectedPeriod = signal<Period>('month');

  dateRange = computed(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    switch(this.selectedPeriod()) {
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    return { start, end };
  });

  filteredTransactions = computed(() => {
    const { start, end } = this.dateRange();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.transactionService.transactions().filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  });
  
  // KPIs
  totalRevenue = computed(() => this.filteredTransactions().filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0));
  totalExpenses = computed(() => this.filteredTransactions().filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  netProfit = computed(() => this.totalRevenue() - this.totalExpenses());
  totalTaxes = computed(() => this.invoiceService.invoices().filter(inv => {
      const iDate = new Date(inv.issueDate);
      const { start, end } = this.dateRange();
      return inv.status !== 'canceled' && iDate >= start && iDate <= end;
    }).reduce((s, i) => s + i.taxAmount, 0)
  );
  
  // Chart Data
  expenseByCategoryChartData = computed(() => {
    const expenses = this.filteredTransactions().filter(t => t.type === 'expense');
    const categoryMap = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  });

  revenueVsExpensesChartData = computed(() => {
    const period = this.selectedPeriod();
    const transactions = this.filteredTransactions();
    const format = period === 'year' ? 'MMM' : 'dd/MM';
    
    const dataMap: Record<string, { revenue: number, expenses: number }> = {};

    transactions.forEach(t => {
      const key = this.datePipe.transform(t.date, format)!;
      if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0 };
      if (t.type === 'revenue') dataMap[key].revenue += t.amount;
      if (t.type === 'expense') dataMap[key].expenses += t.amount;
    });
    
    const sortedKeys = Object.keys(dataMap).sort((a,b) => {
        const dateA = this.parseDate(a, period, this.dateRange().start.getFullYear());
        const dateB = this.parseDate(b, period, this.dateRange().start.getFullYear());
        return dateA.getTime() - dateB.getTime();
    });

    return sortedKeys.map(key => ({
        name: key,
        Receita: dataMap[key].revenue,
        Despesa: dataMap[key].expenses,
    }));
  });

  setPeriod(period: Period) {
    this.selectedPeriod.set(period);
  }
  
  private parseDate(key: string, period: Period, year: number): Date {
    if (period === 'year') {
        const monthIndex = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].indexOf(key.replace('.', ''));
        return new Date(year, monthIndex, 1);
    }
    const [day, month] = key.split('/');
    return new Date(year, parseInt(month) - 1, parseInt(day));
  }
}
