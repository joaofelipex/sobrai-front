import { Component, ChangeDetectionStrategy, inject, signal, OnInit, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { LayoutComponent } from './components/layout/layout.component';
import { OnboardingService } from './services/onboarding.service';
import { TransactionService } from './services/transaction.service';
import { GoalService } from './services/goal.service';
import { RecurringTransactionService } from './services/recurring-transaction.service';
import { DatePipe } from '@angular/common';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    OnboardingComponent,
    LayoutComponent
  ],
  providers: [DatePipe]
})
export class AppComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  goalService = inject(GoalService);
  recurringTransactionService = inject(RecurringTransactionService);
  datePipe = inject(DatePipe);
  private toastService = inject(ToastService);
  private errorHandler = inject(ErrorHandler);

  isOnboardingComplete = this.onboardingService.isOnboardingComplete;

  async ngOnInit() {
    try {
      // Inicializa o onboarding
      this.onboardingService.initialize();
      
      // Verifica se o onboarding foi concluído
      if (this.isOnboardingComplete()) {
        // Processa transações recorrentes em segundo plano
        try {
          await this.recurringTransactionService.processDueTransactions();
        } catch (error) {
          console.error('Erro ao processar transações recorrentes:', error);
          this.toastService.showError('Ocorreu um erro ao processar transações recorrentes.');
        }
      }
      
      // Popula com dados de exemplo se for o primeiro acesso
      await this.populateWithSampleDataIfFirstRun();
      
    } catch (error) {
      console.error('Erro na inicialização do aplicativo:', error);
      this.errorHandler.handleError(error);
      this.toastService.showError('Ocorreu um erro ao inicializar o aplicativo.');
    }
  }

  private async populateWithSampleDataIfFirstRun(): Promise<void> {
    const isFirstRun = this.onboardingService.isFirstRun();
    if (!isFirstRun) return;

    try {
      // Adiciona transações de exemplo
      const sampleTransactions = [
        {
          type: 'revenue' as const,
          description: 'Primeiro Serviço Prestado',
          amount: 1500,
          date: this.formatDate(new Date()),
          category: 'Prestação de Serviço'
        },
        {
          type: 'expense' as const,
          description: 'Compra de Material de Escritório',
          amount: 120.50,
          date: this.formatDate(this.getDateDaysAgo(2)),
          category: 'Fornecedores'
        },
        {
          type: 'expense' as const,
          description: 'Assinatura de Software',
          amount: 59.90,
          date: this.formatDate(this.getDateDaysAgo(5)),
          category: 'Software'
        }
      ];

      // Adiciona as transações
      for (const transaction of sampleTransactions) {
        this.transactionService.addTransaction(transaction);
      }

      // Adiciona uma meta de exemplo
      const profile = this.onboardingService.companyProfile();
      if (profile) {
        this.goalService.addGoal({
          name: `Faturamento de ${this.formatDate(new Date(), 'MMMM')}`,
          type: 'revenue',
          targetAmount: profile.monthlyRevenue * 1.2,
          deadline: this.formatDate(this.getEndOfMonth())
        });
      }

      // Marca o primeiro acesso como concluído
      this.onboardingService.markFirstRunComplete();
      
      // Mostra mensagem de boas-vindas
      this.toastService.showSuccess('Dados iniciais carregados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      this.toastService.showError('Erro ao carregar dados iniciais. Por favor, tente novamente.');
    }
  }
  
  private formatDate(date: Date, format: string = 'yyyy-MM-dd'): string {
    return this.datePipe.transform(date, format) || '';
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private getEndOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}