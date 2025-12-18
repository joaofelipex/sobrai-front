import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';
import { CompanyProfile } from '../../models/company.model';
import { Metric } from '../../models/metric.model';
import { Insight } from '../../models/insight.model';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';
import { AiInsightCardComponent } from '../shared/ai-insight-card/ai-insight-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { WelcomeBannerComponent } from '../shared/welcome-banner/welcome-banner.component';
import { GoalProgressCardComponent } from '../shared/goal-progress-card/goal-progress-card.component';
import { LineChartComponent } from '../shared/chart/line-chart.component';

interface MetricWithLink extends Metric {
  link?: any[];
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MetricCardComponent, AiInsightCardComponent, LoadingSpinnerComponent, WelcomeBannerComponent, GoalProgressCardComponent, LineChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  geminiService = inject(GeminiService);
  invoiceService = inject(InvoiceService);
  goalService = inject(GoalService);

  companyProfile = this.onboardingService.companyProfile;
  insights = signal<Insight[]>([]);
  isLoadingInsights = signal<boolean>(true);
  userName = signal<string>('Empreendedor');
  
  balanceHistory = this.transactionService.balanceHistory;
  
  chartColors: Record<string, string> = {
    'Saldo': '#4f46e5',
  };

  metrics = computed<MetricWithLink[]>(() => {
    const revenue = this.transactionService.totalRevenue();
    const expenses = this.transactionService.totalExpenses();
    const taxes = this.invoiceService.totalTaxesIssued();
    const balance = this.transactionService.balance();
    
    return [
      {
        title: 'Total Receitas',
        value: this.formatCurrency(revenue),
        change: '+15%',
        changeType: 'positive', icon: 'dollar-sign',
        description: 'vs mês anterior',
        link: ['/receitas-e-despesas'],
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Total Despesas',
        value: this.formatCurrency(expenses),
        change: '-5%',
        changeType: 'negative', icon: 'receipt',
        description: 'vs mês anterior',
        link: ['/receitas-e-despesas'],
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600'
      },
       {
        title: 'Impostos (Mês)',
        value: this.formatCurrency(taxes),
        changeType: 'neutral', icon: 'file-text',
        description: '',
        link: ['/notas-fiscais'],
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600'
      },
      {
        title: 'Saldo',
        value: this.formatCurrency(balance),
        changeType: balance >= 0 ? 'positive' : 'negative', icon: 'trending-up',
        description: '',
        link: ['/receitas-e-despesas'],
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      }
    ];
  });

  revenueGoal = computed(() => {
    const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
    return revenueGoals.length > 0 ? revenueGoals[0] : null;
  });

  totalRevenueForGoal = this.transactionService.totalRevenue;

  ngOnInit(): void {
    const profile = this.companyProfile();
    if (profile) {
      this.userName.set(profile.name.split(' ')[0]);
      this.loadInsights(profile);
    }
  }

  async loadInsights(profile: CompanyProfile) {
    this.isLoadingInsights.set(true);
    try {
      const transactions = this.transactionService.transactions();
      const generatedInsights = await this.geminiService.generateFinancialInsights(profile, transactions);
      this.insights.set(generatedInsights.slice(0, 3)); // Show top 3 insights
    } catch (error) {
      console.error("Failed to load insights", error);
    } finally {
      this.isLoadingInsights.set(false);
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}