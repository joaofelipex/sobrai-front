
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { LayoutComponent } from './components/layout/layout.component';
import { OnboardingService } from './services/onboarding.service';
import { TransactionService } from './services/transaction.service';
import { GoalService } from './services/goal.service';
import { DatePipe } from '@angular/common';

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
  datePipe = inject(DatePipe);

  isOnboardingComplete = this.onboardingService.isOnboardingComplete;

  ngOnInit() {
    this.onboardingService.initialize();
    this.populateWithSampleDataIfFirstRun();
  }

  private populateWithSampleDataIfFirstRun() {
    const isFirstRun = this.onboardingService.isFirstRun();
    if (isFirstRun) {
      // Add sample transactions
      this.transactionService.addTransaction({
        type: 'revenue',
        description: 'Primeiro Serviço Prestado',
        amount: 1500,
        date: this.formatDate(new Date()),
        category: 'Prestação de Serviço'
      });
      this.transactionService.addTransaction({
        type: 'expense',
        description: 'Compra de Material de Escritório',
        amount: 120.50,
        date: this.formatDate(this.getDateDaysAgo(2)),
        category: 'Fornecedores'
      });
       this.transactionService.addTransaction({
        type: 'expense',
        description: 'Assinatura de Software',
        amount: 59.90,
        date: this.formatDate(this.getDateDaysAgo(5)),
        category: 'Software'
      });

      // Add a sample goal
      const profile = this.onboardingService.companyProfile();
      this.goalService.addGoal({
        name: `Faturamento de ${this.formatDate(new Date(), 'MMMM')}`,
        type: 'revenue',
        targetAmount: profile ? profile.monthlyRevenue * 1.2 : 10000,
        deadline: this.formatDate(this.getEndOfMonth())
      });

      this.onboardingService.markFirstRunComplete();
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
