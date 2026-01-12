import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { TransactionService } from '../../services/transaction.service';
import { InvoiceService } from '../../services/invoice.service';
import { GoalService } from '../../services/goal.service';

/**
 * Componente principal do painel de controle (dashboard).
 * Exibe um resumo das finanças do usuário, incluindo métricas chave,
 * gráficos e progresso em direção às metas.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  protected readonly Math = Math; // Expõe a classe Math para uso no template.

  // Injeção de dependências dos serviços necessários.
  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);
  private invoiceService = inject(InvoiceService);
  private goalService = inject(GoalService);

  /** Sinal (Signal) que controla o período selecionado para exibição dos dados ('mês' ou 'ano'). */
  selectedPeriod = signal<'month' | 'year'>('month');

  /** Sinal computado (Computed Signal) que obtém a hora atual formatada. */
  currentTime = computed(() => {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  /** Sinal computado que define o subtítulo com base no período selecionado. */
  periodSubtitle = computed(() => {
    return this.selectedPeriod() === 'month' ? 'Este mês' : 'Este ano';
  });

  /** Sinal computado que verifica se existem transações registradas. */
  hasTransactions = computed(() => {
    return this.transactionService.transactions().length > 0;
  });

  /** Sinal computado que resume as receitas, despesas e o lucro do período. */
  periodSummary = computed(() => {
    const revenue = this.transactionService.totalRevenue();
    const expenses = this.transactionService.totalExpenses();
    return {
      revenue,
      expenses,
      profit: revenue - expenses
    };
  });

  /** Sinal computado que prepara os dados para o gráfico de pré-visualização do saldo. */
  chartPreview = computed(() => {
    const history = this.balanceHistory();
    return history.slice(-5).map((item, index) => ({
      label: `Dia ${index + 1}`,
      profit: item['Saldo'] || 0
    }));
  });

  /** Acessa o perfil da empresa a partir do serviço de onboarding. */
  companyProfile = this.onboardingService.companyProfile;

  /** Sinal computado que extrai o primeiro nome do perfil da empresa para saudação. */
  userName = computed(() => {
    const profile = this.companyProfile();
    return profile?.name.split(' ')[0] || 'Empreendedor';
  });

  /** Sinal computado que formata as métricas principais para exibição nos cards. */
  metrics = computed(() => {
    const revenue = this.transactionService.totalRevenue();
    const expenses = this.transactionService.totalExpenses();
    const taxes = this.invoiceService.totalTaxesIssued();
    const balance = this.transactionService.balance();
    
    // As informações de 'change' e 'changeType' são mocadas.
    // Em uma implementação real, seriam calculadas comparando com o período anterior.
    return [
      {
        title: 'Total Receitas',
        value: this.formatCurrency(revenue),
        change: '+15%',
        changeType: 'positive',
        icon: 'dollar-sign',
        description: 'vs mês anterior',
        link: ['/financeiro'],
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
        link: ['/financeiro'],
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600'
      },
      {
        title: 'Impostos (Mês)',
        value: this.formatCurrency(taxes),
        change: '',
        changeType: 'neutral',
        icon: 'file-text',
        description: 'Total de NFs emitidas',
        link: ['/invoices'],
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600'
      },
      {
        title: 'Saldo',
        value: this.formatCurrency(balance),
        change: balance >= 0 ? '+0%' : '-0%',
        changeType: balance >= 0 ? 'positive' : 'negative',
        icon: 'trending-up',
        description: 'Receitas - Despesas',
        link: ['/financeiro'],
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600'
      }
    ];
  });

  /** Acessa o histórico de saldo do serviço de transações. */
  balanceHistory = this.transactionService.balanceHistory;

  /** Sinal computado que busca a primeira meta de receita definida pelo usuário. */
  revenueGoal = computed(() => {
    const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
    return revenueGoals.length > 0 ? revenueGoals[0] : null;
  });

  /** Sinal computado que obtém o total de receitas para comparar com a meta. */
  totalRevenueForGoal = computed(() => this.transactionService.totalRevenue());

  ngOnInit(): void {
    // Lógica de inicialização do componente pode ser adicionada aqui.
  }

  /**
   * Formata um valor numérico como uma string de moeda no formato BRL.
   * @param value O valor a ser formatado.
   * @returns A string formatada (ex: "R$ 1.234,56").
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Define o período de visualização dos dados do dashboard.
   * @param period O período a ser definido ('month' ou 'year').
   */
  setPeriod(period: 'month' | 'year'): void {
    this.selectedPeriod.set(period);
    console.log('Período selecionado:', period);
  }
}
