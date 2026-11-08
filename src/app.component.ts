import { Component, ChangeDetectionStrategy, inject, signal, OnInit, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout.component';
import { OnboardingService } from './services/onboarding.service';
import { RecurringTransactionService } from './services/recurring-transaction.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent
  ],
})
export class AppComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  recurringTransactionService = inject(RecurringTransactionService);
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
      
    } catch (error) {
      console.error('Erro na inicialização do aplicativo:', error);
      this.errorHandler.handleError(error);
      this.toastService.showError('Ocorreu um erro ao inicializar o aplicativo.');
    }
  }
}
