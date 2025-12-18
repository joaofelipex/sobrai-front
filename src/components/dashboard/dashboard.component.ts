import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
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
import { WelcomeBannerComponent } from '../shared/welcome-banner/welcome-banner.component';
import { GoalProgressCardComponent } from '../shared/goal-progress-card/goal-progress-card.component';
import { LineChartComponent } from '../shared/chart/line-chart.component';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { SkeletonLoaderComponent } from '../shared/skeleton-loader/skeleton-loader.component';

interface MetricWithLink extends Metric {
  link?: any[];
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MetricCardComponent, AiInsightCardComponent, WelcomeBannerComponent, GoalProgressCardComponent, LineChartComponent, SkeletonLoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Injeção de dependências
  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);
  private geminiService = inject(GeminiService);
  private invoiceService = inject(InvoiceService);
  private goalService = inject(GoalService);
  private toastService = inject(ToastService);
  private subscriptions = new Subscription();

  // Estados reativos
  companyProfile = this.onboardingService.companyProfile;
  insights = signal<Insight[]>([]);
  isLoadingInsights = signal<boolean>(true);
  isLoadingMetrics = signal<boolean>(true);
  hasError = signal<boolean>(false);
  userName = signal<string>('Empreendedor');
  
  // Dados do gráfico
  balanceHistory = this.transactionService.balanceHistory;
  chartColors: Record<string, string> = { 'Saldo': '#4f46e5' };
  
  // Controles de estado
  isInitialized = signal<boolean>(false);

  // Métodos de ciclo de vida
  ngOnInit(): void {
    this.initializeDashboard();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Inicialização do dashboard
  private async initializeDashboard() {
    try {
      this.hasError.set(false);
      await Promise.all([
        this.loadMetrics(),
        this.loadInsights()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      this.hasError.set(true);
      this.toastService.showError('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
    } finally {
      this.isInitialized.set(true);
    }
  }

  // Carrega as métricas do dashboard
  private async loadMetrics() {
    try {
      this.isLoadingMetrics.set(true);
      
      // As métricas são computadas automaticamente pelos signals
      // Força uma nova computação das métricas
      this.metrics();
      
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      throw error;
    } finally {
      this.isLoadingMetrics.set(false);
    }
  }

  // Carrega os insights financeiros
  private async loadInsights() {
    try {
      this.isLoadingInsights.set(true);
      // Get the required data for generating insights
      const profile = await this.onboardingService.companyProfile().toPromise();
      const transactions = await this.transactionService.transactions().toPromise();
      
      if (profile && transactions) {
        const insights = await this.geminiService.generateFinancialInsights(profile, transactions);
        this.insights.set(insights);
      } else {
        console.warn('Could not load profile or transactions for insights');
        this.insights.set([]);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      this.insights.set([]); // Define como array vazio em caso de erro
    } finally {
      this.isLoadingInsights.set(false);
    }
  }

  // Métodos computados
  metrics = computed<MetricWithLink[]>(() => {
    try {
      const revenue = this.transactionService.totalRevenue();
      const expenses = this.transactionService.totalExpenses();
      const taxes = this.invoiceService.totalTaxesIssued();
      const balance = this.transactionService.balance();
      
      return [
        this.createMetric(
          'Total Receitas', 
          revenue, 
          '+15%', 
          'positive', 
          'dollar-sign', 
          'vs mês anterior', 
          ['/receitas-e-despesas'],
          'bg-green-50',
          'text-green-600'
        ),
        this.createMetric(
          'Total Despesas', 
          expenses, 
          '-5%', 
          'negative', 
          'receipt', 
          'vs mês anterior', 
          ['/receitas-e-despesas'],
          'bg-red-50',
          'text-red-600'
        ),
        this.createMetric(
          'Impostos (Mês)', 
          taxes, 
          '', 
          'neutral', 
          'file-text', 
          '', 
          ['/notas-fiscais'],
          'bg-orange-50',
          'text-orange-600'
        ),
        this.createMetric(
          'Saldo', 
          balance, 
          balance >= 0 ? '+0%' : '-0%', 
          balance >= 0 ? 'positive' : 'negative', 
          'trending-up', 
          '', 
          ['/receitas-e-despesas'],
          'bg-blue-50',
          'text-blue-600'
        )
      ];
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return [];
    }
  });

  revenueGoal = computed(() => {
    try {
      const revenueGoals = this.goalService.goals().filter(g => g.type === 'revenue');
      return revenueGoals.length > 0 ? revenueGoals[0] : null;
    } catch (error) {
      console.error('Erro ao carregar meta de receita:', error);
      return null;
    }
  });

  totalRevenueForGoal = computed(() => {
    try {
      return this.transactionService.totalRevenue();
    } catch (error) {
      console.error('Erro ao calcular receita total:', error);
      return 0;
    }
  });

  // Teste de notificações
  testNotifications() {
    console.log('Testando notificações...');
    
    // Teste de sucesso
    this.toastService.success('Esta é uma mensagem de sucesso!');
    
    // Teste de erro após 1 segundo
    setTimeout(() => {
      this.toastService.error('Esta é uma mensagem de erro!');
    }, 1000);
    
    // Teste de informação após 2 segundos
    setTimeout(() => {
      this.toastService.info('Esta é uma mensagem informativa!');
    }, 2000);
  }

  // Métodos auxiliares
  private createMetric(
    title: string,
    value: number,
    change: string,
    changeType: 'positive' | 'negative' | 'neutral',
    icon: string,
    description: string,
    link: string[],
    bgColor: string,
    iconColor: string
  ): MetricWithLink {
    return {
      title,
      value: this.formatCurrency(value),
      change,
      changeType,
      icon,
      description,
      link,
      bgColor,
      iconColor
    };
  }

  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } catch (error) {
      console.error('Erro ao formatar valor monetário:', error);
      return 'R$ 0,00';
    }
  }

  // Método para rastrear itens em loops *ngFor
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}