import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent implements OnInit {
  protected readonly Math = Math;

  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);
  private invoiceService = inject(InvoiceService);
  private goalService = inject(GoalService);

  companyProfile = this.onboardingService.companyProfile;
  userName = computed(() => {
    const profile = this.companyProfile();
    return profile?.name || 'Empreendedor';
  });

  metrics = computed(() => {
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
  });

  balanceHistory = this.transactionService.balanceHistory;
  revenueGoal = computed(() => {
    const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
    return revenueGoals.length > 0 ? revenueGoals[0] : null;
  });
  totalRevenueForGoal = computed(() => this.transactionService.totalRevenue());

  ngOnInit(): void {
    console.log('✅ DashboardComponent ngOnInit executado');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
