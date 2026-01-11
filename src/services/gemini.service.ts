import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { environment } from '../environments/environment';
import { Insight } from '../models/insight.model';
import { CompanyProfile } from '../models/company.model';
import { Transaction } from '../models/transaction.model';

/**
 * Serviço para integração com a API do Google Gemini.
 *
 * Responsável por configurar o cliente da API e gerar insights financeiros
 * com base nos dados do usuário, como perfil da empresa e transações.
 * Em caso de falha ou falta da chave de API, retorna dados mocados.
 */
@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  /**
   * Construtor do serviço.
   * Inicializa o cliente da API do Google Gemini com a chave fornecida
   * no arquivo de ambiente. Exibe um erro no console se a chave não estiver configurada.
   */
  constructor() {
    const apiKey = environment.geminiApiKey;
    if (!apiKey) {
      console.error("API Key for Gemini is not configured.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Gera insights financeiros acionáveis usando o modelo de IA do Gemini.
   *
   * Constrói um prompt detalhado com o perfil da empresa e um resumo das transações
   * recentes e envia para a API do Gemini, esperando uma resposta em formato JSON
   * contendo uma lista de insights.
   *
   * Se a chave da API não estiver configurada ou ocorrer um erro na chamada,
   * este método retorna uma lista de insights mocados para garantir que a
   * aplicação continue funcionando.
   *
   * @param profile O perfil da empresa do usuário.
   * @param transactions Uma lista de transações recentes para análise.
   * @returns Uma `Promise` que resolve para um array de `Insight`.
   */
  async generateFinancialInsights(profile: CompanyProfile, transactions: Transaction[]): Promise<Insight[]> {
    // Calculate totals before using them
    const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Fallback to mock data if AI is not configured
    if (!this.ai || !environment.geminiApiKey) {
        return Promise.resolve([
            {
              title: 'Economia através de otimização fiscal',
              description: `Com base em ${transactions.filter(t => t.type === 'expense').length} despesas e ${transactions.length} transações, você pode economizar até R$ 450/mês revisando seu enquadramento tributário e otimizando despesas dedutíveis.`,
              icon: 'dollar-sign',
              priority: 'Alta prioridade',
              type: 'economy',
              estimatedImpact: 'R$ 450,00'
            },
            {
              title: 'Fluxo de caixa positivo previsto',
              description: `Analisando suas ${transactions.filter(t => t.type === 'revenue').length} receitas e padrões de faturamento, estimo R$ ${totalRevenue.toLocaleString('pt-BR')} nos próximos 30 dias.`,
              icon: 'trending-up',
              priority: 'Média prioridade',
              type: 'cashflow',
              estimatedImpact: `R$ ${totalRevenue.toLocaleString('pt-BR')}`
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
      // Fallback to mock data in case of an API error
       return Promise.resolve([
            {
              title: 'Economia através de otimização fiscal',
              description: `Com base em ${transactions.filter(t => t.type === 'expense').length} despesas e ${transactions.length} transações, você pode economizar até R$ 450/mês revisando seu enquadramento tributário e otimizando despesas dedutíveis.`,
              icon: 'dollar-sign',
              priority: 'Alta prioridade',
              type: 'economy',
              estimatedImpact: 'R$ 450,00'
            },
            {
              title: 'Fluxo de caixa positivo previsto',
              description: `Analisando suas ${transactions.filter(t => t.type === 'revenue').length} receitas e padrões de faturamento, estimo R$ ${totalRevenue.toLocaleString('pt-BR')} nos próximos 30 dias.`,
              icon: 'trending-up',
              priority: 'Média prioridade',
              type: 'cashflow',
              estimatedImpact: `R$ ${totalRevenue.toLocaleString('pt-BR')}`
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