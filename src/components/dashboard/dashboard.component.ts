import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  signal, 
  effect,
  computed, 
  ChangeDetectionStrategy, 
  PLATFORM_ID, 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

// Services
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';

import { Transaction } from '../../models/transaction.model';

// Components
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';

// Types

type MetricChangeType = 'positive' | 'negative' | 'neutral';

type DashboardPeriod = 'month' | 'year';

interface PeriodSummary {
  revenue: number;
  expenses: number;
  profit: number;
}

interface ChartPreviewItem {
  label: string;
  profit: number;
}

interface LineChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
}

interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

interface MetricWithLink {
  title: string;
  value: string;
  change: string;
  changeType: MetricChangeType;
  icon: string;
  description: string;
  link: string[];
  bgColor: string;
  iconColor: string;
}

interface FinancialData {
  labels: string[];
  revenue: number[];
  expenses: number[];
  profit: number[];
}



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetricCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [
    `
    .chart-container {
      position: relative;
      margin: auto;
      height: 300px;
      width: 100%;
    }
    .recent-transactions {
      max-height: 400px;
      overflow-y: auto;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Services
  private readonly onboardingService = inject(OnboardingService);
  private readonly transactionService = inject(TransactionService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly goalService = inject(GoalService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly selectedPeriod = signal<DashboardPeriod>('month');
  
  // Signals
  readonly companyProfile = this.onboardingService.companyProfile;
  readonly currentTime = signal<string>('');
  private timeInterval: any = null;
  
  // Chart configuration
  public lineChartData: LineChartData = {
    datasets: [
      {
        data: [],
        label: 'Receitas',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)'
      },
      {
        data: [],
        label: 'Despesas',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)'
      },
      {
        data: [],
        label: 'Lucro',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)'
      }
    ],
    labels: []
  };

  // Recent transactions
  readonly recentTransactions = signal<Transaction[]>([]);

  // Computed properties
  readonly userName = computed(() => {
    try {
      return this.companyProfile()?.name || 'Empreendedor';
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
      return 'Usuário';
    }
  });

  /**
   * Computed property for dashboard metrics
   */
  readonly metrics = computed<MetricWithLink[]>(() => {
    try {
      const revenue = this.transactionService.totalRevenue();
      const expenses = this.transactionService.totalExpenses();
      const taxes = this.invoiceService.totalTaxesIssued();
      const balance = this.transactionService.balance();
      
      return this.generateMetrics({
        revenue,
        expenses,
        taxes,
        balance,
        revenueChange: this.calculateMonthOverMonthChange('revenue'),
        expensesChange: this.calculateMonthOverMonthChange('expense')
      });
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return [];
    }
  });

  // Data streams
  readonly balanceHistory = this.transactionService.balanceHistory;

  readonly hasTransactions = computed(() => {
    try {
      return this.transactionService.transactions().length > 0;
    } catch (error) {
      console.error('Erro ao verificar transações:', error);
      return false;
    }
  });

  private readonly chartEffect = effect(() => {
    if (!isPlatformBrowser(this.platformId)) return;

    const period = this.selectedPeriod();
    const transactions = this.transactionService.transactions();
    this.updateChartData(transactions, period);
  });

  readonly periodSubtitle = computed(() =>
    this.selectedPeriod() === 'year' ? 'Últimos 12 meses' : 'Últimos 30 dias'
  );

  readonly periodSummary = computed<PeriodSummary>(() => {
    try {
      const data = this.buildFinancialData(
        this.transactionService.transactions(),
        this.selectedPeriod()
      );

      const revenue = data.revenue.reduce((acc, v) => acc + v, 0);
      const expenses = data.expenses.reduce((acc, v) => acc + v, 0);
      const profit = data.profit.reduce((acc, v) => acc + v, 0);

      return { revenue, expenses, profit };
    } catch (error) {
      console.error('Erro ao calcular resumo do período:', error);
      return { revenue: 0, expenses: 0, profit: 0 };
    }
  });

  readonly chartPreview = computed<ChartPreviewItem[]>(() => {
    try {
      const data = this.buildFinancialData(
        this.transactionService.transactions(),
        this.selectedPeriod()
      );

      const total = data.labels.length;
      const start = Math.max(0, total - 5);

      return data.labels.slice(start).map((label, idx) => ({
        label,
        profit: data.profit[start + idx] ?? 0
      }));
    } catch (error) {
      console.error('Erro ao gerar preview do gráfico:', error);
      return [];
    }
  });
  
  /**
   * Computed property for revenue goal
   */
  readonly revenueGoal = computed(() => {
    try {
      const revenueGoals = this.goalService.goals()
        .filter(goal => goal?.type === 'revenue')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      
      return revenueGoals[0] || null;
    } catch (error) {
      console.error('Erro ao buscar metas de receita:', error);
      return null;
    }
  });
  
  /**
   * Computed property for total revenue for goal comparison
   */
  readonly totalRevenueForGoal = computed(() => {
    try {
      return this.transactionService.totalRevenue();
    } catch (error) {
      console.error('Erro ao calcular receita total:', error);
      return 0;
    }
  });

  /**
   * Component initialization
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateTime();
      this.timeInterval = setInterval(() => this.updateTime(), 60000);
    }
    
    // Initial data fetch
    this.initializeData();
  }

  /**
   * Clean up on component destruction
   */
  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  /**
   * Update the current time display
   */
  private updateTime(): void {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      };
      
      this.currentTime.set(now.toLocaleTimeString('pt-BR', options));
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
    }
  }

  /**
   * Format currency value to BRL
   */
  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      console.error('Erro ao formatar valor monetário:', error);
      return 'R$ 0,00';
    }
  }

  /**
   * Calculate month-over-month change percentage
   */
  private calculateMonthOverMonthChange(type: 'revenue' | 'expense'): string {
    try {
      // This is a simplified example - implement your actual month-over-month logic
      // You might want to fetch data from your service
      return type === 'revenue' ? '+15%' : '-5%';
    } catch (error) {
      console.error(`Erro ao calcular variação mensal para ${type}:`, error);
      return '0%';
    }
  }

  /**
   * Generate metrics array based on financial data
   */
  private generateMetrics(data: {
    revenue: number;
    expenses: number;
    taxes: number;
    balance: number;
    revenueChange: string;
    expensesChange: string;
  }): MetricWithLink[] {
    return [
      {
        title: 'Total Receitas',
        value: this.formatCurrency(data.revenue),
        change: data.revenueChange,
        changeType: data.revenue >= 0 ? 'positive' : 'negative',
        icon: 'dollar-sign',
        description: 'vs mês anterior',
        link: ['receitas-e-despesas'],
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Total Despesas',
        value: this.formatCurrency(Math.abs(data.expenses)),
        change: data.expensesChange,
        changeType: data.expenses <= 0 ? 'positive' : 'negative',
        icon: 'receipt',
        description: 'vs mês anterior',
        link: ['receitas-e-despesas'],
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600'
      },
      {
        title: 'Impostos (Mês)',
        value: this.formatCurrency(data.taxes),
        change: '',
        changeType: 'neutral',
        icon: 'file-text',
        description: '',
        link: ['notas-fiscais'],
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600'
      },
      {
        title: 'Saldo',
        value: this.formatCurrency(data.balance),
        change: data.balance >= 0 ? '+0%' : '-0%',
        changeType: data.balance >= 0 ? 'positive' : 'negative',
        icon: 'trending-up',
        description: '',
        link: ['receitas-e-despesas'],
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      }
    ];
  }

  /**
   * Initialize component data
   */
  private initializeData(): void {
    try {
      // You can add any initial data loading here
      // Example: this.loadRecentTransactions();
    } catch (error) {
      console.error('Erro ao inicializar dados do dashboard:', error);
    }
  }

  setPeriod(period: DashboardPeriod): void {
    this.selectedPeriod.set(period);
  }

  private updateChartData(transactions: Transaction[], period: DashboardPeriod): void {
    try {
      const data = this.buildFinancialData(transactions, period);

      const datasets = this.lineChartData.datasets.map((dataset, index) => {
        if (index === 0) return { ...dataset, data: data.revenue };
        if (index === 1) return { ...dataset, data: data.expenses };
        return { ...dataset, data: data.profit };
      });

      this.lineChartData = {
        ...this.lineChartData,
        labels: data.labels,
        datasets
      };
    } catch (error) {
      console.error('Erro ao atualizar dados do gráfico:', error);
    }
  }

  private buildFinancialData(transactions: Transaction[], period: DashboardPeriod): FinancialData {
    return period === 'year'
      ? this.buildYearlyFinancialData(transactions)
      : this.buildMonthlyFinancialData(transactions);
  }

  private buildMonthlyFinancialData(transactions: Transaction[]): FinancialData {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    const revenueByDay = new Map<string, number>();
    const expenseByDay = new Map<string, number>();

    for (const t of transactions) {
      const date = new Date(t.date);
      if (Number.isNaN(date.getTime())) continue;
      if (date < start || date > end) continue;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (t.type === 'revenue') {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + t.amount);
      } else {
        expenseByDay.set(key, (expenseByDay.get(key) ?? 0) + t.amount);
      }
    }

    const labels: string[] = [];
    const revenue: number[] = [];
    const expenses: number[] = [];
    const profit: number[] = [];

    for (let i = 0; i <= 30; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const r = revenueByDay.get(key) ?? 0;
      const e = expenseByDay.get(key) ?? 0;

      labels.push(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`);
      revenue.push(r);
      expenses.push(e);
      profit.push(r - e);
    }

    return { labels, revenue, expenses, profit };
  }

  private buildYearlyFinancialData(transactions: Transaction[]): FinancialData {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    start.setHours(0, 0, 0, 0);

    const revenueByMonth = new Map<string, number>();
    const expenseByMonth = new Map<string, number>();

    for (const t of transactions) {
      const date = new Date(t.date);
      if (Number.isNaN(date.getTime())) continue;
      if (date < start) continue;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (t.type === 'revenue') {
        revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + t.amount);
      } else {
        expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + t.amount);
      }
    }

    const labels: string[] = [];
    const revenue: number[] = [];
    const expenses: number[] = [];
    const profit: number[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const r = revenueByMonth.get(key) ?? 0;
      const e = expenseByMonth.get(key) ?? 0;

      labels.push(`${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`);
      revenue.push(r);
      expenses.push(e);
      profit.push(r - e);
    }

    return { labels, revenue, expenses, profit };
  }
}
