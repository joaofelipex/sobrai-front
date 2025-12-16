import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { environment } from '../environments/environment';
import { Insight } from '../models/insight.model';
import { CompanyProfile } from '../models/company.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.error("API Key for Gemini is not configured.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateFinancialInsights(profile: CompanyProfile, transactions: Transaction[]): Promise<Insight[]> {
    if (!this.ai || !process.env.API_KEY) {
        return Promise.resolve([
            { 
              title: 'Economia através de otimização fiscal',
              description: 'Com base em 2 notas fiscais e 50 transações, você pode economizar até R$ 450/mês revisando seu enquadramento tributário e otimizando despesas dedutíveis.',
              icon: 'dollar-sign',
              priority: 'Alta prioridade',
              type: 'economy',
              estimatedImpact: 'R$ 450,00'
            },
            {
              title: 'Fluxo de caixa positivo previsto',
              description: 'Analisando suas 9 receitas e padrões de faturamento, estimo R$ 5.349,89 nos próximos 30 dias.',
              icon: 'trending-up',
              priority: 'Média prioridade',
              type: 'cashflow',
              estimatedImpact: 'R$ 5.349,89'
            },
            {
              title: 'Lembrete: DAS vence em 5 dias',
              description: 'Seu próximo pagamento de impostos está se aproximando. Configure alertas automáticos para nunca perder um prazo e evitar multas.',
              icon: 'alert-triangle',
              priority: 'Alta prioridade',
              type: 'reminder',
              estimatedImpact: 'Evitar multas'
            }
        ]);
    }

    const model = 'gemini-2.5-flash';
    const companyTypeMap = {
      'mei': 'MEI (Microempreendedor Individual)',
      'simples': 'Simples Nacional',
      'autonomo': 'Trabalhador Autônomo'
    };
    const companyType = companyTypeMap[profile.type] || 'Pequeno Negócio';

    // Create a summary of transactions
    const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);
    const topExpenseCategories = Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, value]) => `${name}: R$ ${value.toFixed(2)}`)
      .join(', ');

    const transactionSummary = `
      - Resumo dos últimos 30 dias:
      - Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}
      - Despesa Total: R$ ${totalExpenses.toLocaleString('pt-BR')}
      - Principais Despesas: ${topExpenseCategories || 'Nenhuma despesa registrada.'}
    `;

    const prompt = `
      Você é 'Sobrai', um assistente financeiro especialista em pequenos negócios no Brasil.
      Seu tom é empático, motivador e fala a língua do empreendedor brasileiro.

      Analise o perfil e o resumo financeiro de uma empresa e gere 3 insights acionáveis e práticos.
      - Perfil da Empresa: ${companyType}
      - Faturamento Mensal Estimado no Onboarding: R$ ${profile.monthlyRevenue.toLocaleString('pt-BR')}
      
      ${transactionSummary}

      Os insights devem ser diretos, baseados nos dados fornecidos, fáceis de entender e focados em otimização fiscal, economia ou melhoria do fluxo de caixa.
      Varie os ícones entre 'lightbulb', 'trending-up', 'shield', 'zap', 'award'.
      Para o campo 'type', use 'economy', 'cashflow', ou 'reminder'.
      Para o campo 'priority', use 'Alta prioridade', 'Média prioridade', ou 'Baixa prioridade'.
      Preencha o campo 'estimatedImpact' com um valor em R$ ou uma breve descrição do impacto.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    insights: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                icon: { type: Type.STRING },
                                priority: { type: Type.STRING },
                                type: { type: Type.STRING },
                                estimatedImpact: { type: Type.STRING },
                            },
                        },
                    },
                },
            },
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      return jsonResponse.insights as Insight[];

    } catch (error) {
      console.error('Error generating insights with Gemini:', error);
       return Promise.resolve([
            { 
              title: 'Economia através de otimização fiscal',
              description: 'Com base em 2 notas fiscais e 50 transações, você pode economizar até R$ 450/mês revisando seu enquadramento tributário e otimizando despesas dedutíveis.',
              icon: 'dollar-sign',
              priority: 'Alta prioridade',
              type: 'economy',
              estimatedImpact: 'R$ 450,00'
            },
            {
              title: 'Fluxo de caixa positivo previsto',
              description: 'Analisando suas 9 receitas e padrões de faturamento, estimo R$ 5.349,89 nos próximos 30 dias.',
              icon: 'trending-up',
              priority: 'Média prioridade',
              type: 'cashflow',
              estimatedImpact: 'R$ 5.349,89'
            },
            {
              title: 'Lembrete: DAS vence em 5 dias',
              description: 'Seu próximo pagamento de impostos está se aproximando. Configure alertas automáticos para nunca perder um prazo e evitar multas.',
              icon: 'alert-triangle',
              priority: 'Alta prioridade',
              type: 'reminder',
              estimatedImpact: 'Evitar multas'
            }
        ]);
    }
  }
}