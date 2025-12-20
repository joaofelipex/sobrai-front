import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../../services/gemini.service';
import { OnboardingService } from '../../../services/onboarding.service';
import { TransactionService } from '../../../services/transaction.service';
import { Insight } from '../../../models/insight.model';
import { AiInsightCardComponent } from '../../shared/ai-insight-card/ai-insight-card.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-ai-insights-page',
  standalone: true,
  imports: [CommonModule, AiInsightCardComponent, SkeletonLoaderComponent],
  templateUrl: './ai-insights-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiInsightsPageComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private onboardingService = inject(OnboardingService);
  private transactionService = inject(TransactionService);

  insights = signal<Insight[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.generateInsights();
  }

  async generateInsights(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    const profile = this.onboardingService.companyProfile();
    const transactions = this.transactionService.transactions();

    if (!profile) {
      this.error.set('Perfil da empresa não encontrado. Complete o onboarding para obter insights.');
      this.isLoading.set(false);
      return;
    }

    try {
      const result = await this.geminiService.generateFinancialInsights(profile, transactions);
      this.insights.set(result);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      this.error.set('Não foi possível gerar os insights. Tente novamente mais tarde.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
