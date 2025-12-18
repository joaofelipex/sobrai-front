import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';
import { Insight } from '../../models/insight.model';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';
import { WelcomeBannerComponent } from '../shared/welcome-banner/welcome-banner.component';
import { LineChartComponent } from '../shared/chart/line-chart.component';
import { GoalProgressCardComponent } from '../shared/goal-progress-card/goal-progress-card.component';
import { AiInsightCardComponent } from '../shared/ai-insight-card/ai-insight-card.component';

interface MetricWithLink {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
  link: string[];
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetricCardComponent,
    WelcomeBannerComponent,
    LineChartComponent,
    GoalProgressCardComponent,
    AiInsightCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DashboardComponent implements OnInit {
  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);
  private geminiService = inject(GeminiService);
  private invoiceService = inject(InvoiceService);
  private goalService = inject(GoalService);

  companyProfile = this.onboardingService.companyProfile;
  insights = signal<Insight[]>([]);
  isLoadingInsights = signal<boolean>(true);

  userName = computed(() => {
    const profile = this.companyProfile();
    return profile?.name || 'Empreendedor';
  });

  metrics = computed<MetricWithLink[]>(() => {
    try {
      const revenue = this.transactionService.totalRevenue();
      const expenses = this.transactionService.totalExpenses();
      const taxes = this.invoiceService.totalTaxesIssued();
      const balance = this.transactionService.balance();
      
      return [
        {
          title: 'Total Receitas',
          value: this.formatCurrency(revenue),
          change: '+15%',
          changeType: 'positive',
          icon: 'dollar-sign',
          description: 'vs mês anterior',
          link: ['receitas-e-despesas'],
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600'
        },
        {
          title: 'Total Despesas',
          value: this.formatCurrency(expenses),
          change: '-5%',
          changeType: 'negative',
          icon: 'receipt',
          description: 'vs mês anterior',
          link: ['receitas-e-despesas'],
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600'
        },
        {
          title: 'Impostos (Mês)',
          value: this.formatCurrency(taxes),
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
          value: this.formatCurrency(balance),
          change: balance >= 0 ? '+0%' : '-0%',
          changeType: balance >= 0 ? 'positive' : 'negative',
          icon: 'trending-up',
          description: '',
          link: ['receitas-e-despesas'],
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600'
        }
      ];
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return [];
    }
  });

  balanceHistory = this.transactionService.balanceHistory;
  chartColors: Record<string, string> = { 'Saldo': '#4f46e5' };

  revenueGoal = computed(() => {
    try {
      const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
      return revenueGoals.length > 0 ? revenueGoals[0] : null;
    } catch (error) {
      return null;
    }
  });

  totalRevenueForGoal = computed(() => {
    try {
      return this.transactionService.totalRevenue();
    } catch (error) {
      return 0;
    }
  });

  ngOnInit(): void {
    this.loadInsights();
  }

  private async loadInsights() {
    try {
      this.isLoadingInsights.set(true);
      
      const profile = this.companyProfile();
      const transactions = this.transactionService.transactions();
      
      if (profile && transactions.length > 0) {
        try {
          const insights = await this.geminiService.generateFinancialInsights(profile, transactions);
          this.insights.set(insights);
        } catch (error) {
          console.warn('Erro ao gerar insights da IA:', error);
          this.insights.set([]);
        }
      } else {
        this.insights.set([]);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      this.insights.set([]);
    } finally {
      this.isLoadingInsights.set(false);
    }
  }

  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } catch (error) {
      return 'R$ 0,00';
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
