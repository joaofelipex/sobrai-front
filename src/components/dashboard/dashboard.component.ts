
import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { GoalService } from '../../services/goal.service';
import { InvoiceService } from '../../services/invoice.service';
import { CompanyProfile } from '../../models/company.model';
import { Metric } from '../../models/metric.model';
import { Insight } from '../../models/insight.model';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';
import { AiInsightCardComponent } from '../shared/ai-insight-card/ai-insight-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { GoalProgressCardComponent } from '../shared/goal-progress-card/goal-progress-card.component';

interface MetricWithLink extends Metric {
  link?: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MetricCardComponent, AiInsightCardComponent, LoadingSpinnerComponent, GoalProgressCardComponent],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  geminiService = inject(GeminiService);
  goalService = inject(GoalService);
  invoiceService = inject(InvoiceService);

  companyProfile = this.onboardingService.companyProfile;
  insights = signal<Insight[]>([]);
  isLoadingInsights = signal<boolean>(true);
  companyName = signal<string>('seu negócio');
  
  metrics = computed<MetricWithLink[]>(() => {
    const revenue = this.transactionService.totalRevenue();
    const expenses = this.transactionService.totalExpenses();
    const taxes = this.invoiceService.totalTaxesIssued();
    
    return [
      {
        title: 'Faturamento (Mês)',
        value: this.formatCurrency(revenue),
        change: '', changeType: 'positive', icon: 'trending-up',
        description: 'Total de receitas.',
        link: ['/financeiro', { filter: 'revenue' }]
      },
      {
        title: 'Despesas (Mês)',
        value: this.formatCurrency(expenses),
        change: '', changeType: 'neutral', icon: 'receipt',
        description: 'Total de gastos.',
        link: ['/financeiro', { filter: 'expense' }]
      },
       {
        title: 'Saldo Líquido',
        value: this.formatCurrency(this.transactionService.balance()),
        change: '', changeType: 'neutral', icon: 'bar-chart',
        description: 'Receitas menos despesas.',
        link: ['/financeiro']
      },
      {
        title: 'Impostos Gerados',
        value: this.formatCurrency(taxes),
        change: '', changeType: 'neutral', icon: 'shield',
        description: 'Total de impostos das NFs emitidas.',
        link: ['/notas-fiscais']
      }
    ];
  });

  recentTransactions = computed(() => this.transactionService.transactions().slice(0, 5));
  
  revenueGoal = computed(() => {
    const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
    return revenueGoals.length > 0 ? revenueGoals[0] : null;
  });

  totalRevenueForGoal = this.transactionService.totalRevenue;

  ngOnInit(): void {
    const profile = this.companyProfile();
    if (profile) {
      this.companyName.set(profile.name.split(' ')[0]);
      this.loadInsights(profile);
    }
  }

  async loadInsights(profile: CompanyProfile) {
    this.isLoadingInsights.set(true);
    try {
      const currentRevenue = this.transactionService.totalRevenue() || profile.monthlyRevenue;
      const profileForInsights = { ...profile, monthlyRevenue: currentRevenue };
      const generatedInsights = await this.geminiService.generateFinancialInsights(profileForInsights);
      this.insights.set(generatedInsights);
    } catch (error) {
      console.error("Failed to load insights", error);
      this.insights.set([
        { title: 'Erro ao carregar', description: 'Não foi possível buscar as dicas da IA. Tente novamente mais tarde.', icon: 'alert-triangle' }
      ]);
    } finally {
      this.isLoadingInsights.set(false);
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
