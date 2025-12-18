import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';
import { MetricCardComponent } from '../shared/metric-card/metric-card.component';

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
    MetricCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DashboardComponent implements OnInit {
  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);
  private invoiceService = inject(InvoiceService);
  private goalService = inject(GoalService);

  companyProfile = this.onboardingService.companyProfile;
  currentTime = signal<string>('');

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
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
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
}
