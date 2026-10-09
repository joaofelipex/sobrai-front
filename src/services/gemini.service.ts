import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Insight } from '../models/insight.model';
import { CompanyProfile } from '../models/company.model';
import { Transaction } from '../models/transaction.model';

/**
 * Serviço para geração de insights financeiros com IA (Google Gemini).
 *
 * A chamada ao Gemini é feita pelo backend (`POST /api/insights`), que guarda a chave
 * de API em variável de ambiente. Em caso de falha ou backend sem chave configurada,
 * retorna insights de exemplo para a aplicação continuar funcionando.
 */
@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private http = inject(HttpClient);

  /**
   * Gera insights financeiros acionáveis a partir do perfil e das transações.
   * @param profile O perfil da empresa do usuário.
   * @param transactions Uma lista de transações recentes para análise.
   */
  async generateFinancialInsights(profile: CompanyProfile, transactions: Transaction[]): Promise<Insight[]> {
    try {
      const { insights } = await firstValueFrom(
        this.http.post<{ insights: Insight[] }>(`${environment.backendUrl}/api/insights`, {
          profile,
          transactions: transactions.map(({ type, amount, category }) => ({ type, amount, category })),
        })
      );
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.mockInsights(transactions);
    }
  }

  private mockInsights(transactions: Transaction[]): Insight[] {
    const expenses = transactions.filter(t => t.type === 'expense').length;
    const revenues = transactions.filter(t => t.type === 'revenue');
    const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR');
    return [
      {
        title: 'Economia através de otimização fiscal',
        description: `Com base em ${expenses} despesas e ${transactions.length} transações, você pode economizar até R$ 450/mês revisando seu enquadramento tributário e otimizando despesas dedutíveis.`,
        icon: 'dollar-sign',
        priority: 'Alta prioridade',
        type: 'economy',
        estimatedImpact: 'R$ 450,00'
      },
      {
        title: 'Fluxo de caixa positivo previsto',
        description: `Analisando suas ${revenues.length} receitas e padrões de faturamento, estimo R$ ${totalRevenue} nos próximos 30 dias.`,
        icon: 'trending-up',
        priority: 'Média prioridade',
        type: 'cashflow',
        estimatedImpact: `R$ ${totalRevenue}`
      },
      {
        title: 'Lembrete: DAS vence em 5 dias',
        description: 'Seu próximo pagamento de impostos está se aproximando. Configure alertas automáticos para nunca perder um prazo e evitar multas.',
        icon: 'alert-triangle',
        priority: 'Alta prioridade',
        type: 'reminder',
        estimatedImpact: 'Evitar multas'
      }
    ];
  }
}
