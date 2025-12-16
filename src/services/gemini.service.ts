
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { environment } from '../environments/environment';
import { Insight } from '../models/insight.model';
import { CompanyProfile } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: Replace with your actual API key mechanism, e.g., environment variables.
    // This is a placeholder and should not be used in production.
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.error("API Key for Gemini is not configured.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateFinancialInsights(profile: CompanyProfile): Promise<Insight[]> {
    if (!this.ai || !process.env.API_KEY) {
        return Promise.resolve([
            { title: 'API Key não configurada', description: 'Configure sua chave de API da Gemini para obter insights.', icon: 'key' },
            { title: 'Organize suas despesas', description: 'Categorize seus gastos para identificar oportunidades de economia.', icon: 'wallet' },
            { title: 'Planeje seu fluxo de caixa', description: 'Antecipe receitas e despesas para evitar surpresas no final do mês.', icon: 'calendar' }
        ]);
    }

    const model = 'gemini-2.5-flash';
    const companyTypeMap = {
      'mei': 'MEI (Microempreendedor Individual)',
      'simples': 'Simples Nacional',
      'autonomo': 'Trabalhador Autônomo'
    };
    const companyType = companyTypeMap[profile.type] || 'Pequeno Negócio';

    const prompt = `
      Você é 'Sobrai', um assistente financeiro especialista em pequenos negócios no Brasil.
      Seu tom é empático, motivador e fala a língua do empreendedor brasileiro.

      Analise o perfil de uma empresa e gere 3 insights acionáveis e práticos.
      - Perfil da Empresa: ${companyType}
      - Faturamento Mensal Estimado: R$ ${profile.monthlyRevenue.toLocaleString('pt-BR')}

      Os insights devem ser diretos, fáceis de entender e focados em otimização fiscal, economia ou melhoria do fluxo de caixa.
      Varie os ícones entre 'lightbulb', 'trending-up', 'shield', 'zap', 'award'.
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
                                icon: { type: Type.STRING }
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
      return [
        { title: 'Otimize seus impostos', description: `Como ${companyType}, explore deduções específicas para sua área.`, icon: 'shield' },
        { title: 'Crie uma reserva de emergência', description: 'Guarde o equivalente a 3-6 meses de custos fixos para ter mais segurança.', icon: 'award' },
        { title: 'Renegocie com fornecedores', description: 'Busque descontos em pagamentos à vista ou melhores condições de prazo.', icon: 'lightbulb' }
      ];
    }
  }
}
