import { Injectable, signal, computed } from '@angular/core';
import { SubscriptionPlan } from '../models/subscription.model';

/**
 * Interface que define a estrutura de um item do histórico de faturamento.
 */
export interface BillingHistoryItem {
  date: string;
  planName: string;
  amount: number;
  status: 'paid' | 'failed';
}

/**
 * Serviço para gerenciar os planos de assinatura e o histórico de faturamento do usuário.
 *
 * Responsável por carregar, exibir e alterar o plano de assinatura.
 * Atualmente, utiliza dados mocados e persiste a seleção do plano no `localStorage`.
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private storageKey = 'sobrai_subscription_v1';
  
  /** Sinal (Signal) que armazena a lista de planos de assinatura disponíveis. */
  availablePlans = signal<SubscriptionPlan[]>([
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      features: [
        'Até 50 transações/mês',
        'Emissão de 10 NFs/mês',
        'Insights básicos da IA',
        'Suporte via email'
      ]
    },
    {
      id: 'growth',
      name: 'Crescimento',
      price: 99,
      features: [
        'Transações ilimitadas',
        'Emissão de NFs ilimitada',
        'Insights avançados da IA',
        'Definição de Metas',
        'Suporte prioritário'
      ]
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 149,
      features: [
        'Tudo do plano Crescimento',
        'Relatórios avançados',
        'Conciliação bancária',
        'Múltiplos usuários (em breve)'
      ]
    }
  ]);

  /** Sinal (Signal) que armazena o histórico de faturamento (atualmente mocado). */
  billingHistory = signal<BillingHistoryItem[]>([
      { date: '2024-05-01', planName: 'Starter', amount: 49.00, status: 'paid' },
      { date: '2024-04-01', planName: 'Starter', amount: 49.00, status: 'paid' },
      { date: '2024-03-01', planName: 'Starter', amount: 49.00, status: 'paid' },
  ]);

  /** Sinal (Signal) que armazena o ID do plano de assinatura atual do usuário. */
  currentPlanId = signal<'starter' | 'growth' | 'pro'>('starter');

  /** 
   * Sinal computado (Computed Signal) que retorna o objeto do plano de assinatura atual.
   * Este valor é derivado automaticamente a partir de `availablePlans` e `currentPlanId`.
   */
  currentPlan = computed(() => 
    this.availablePlans().find(p => p.id === this.currentPlanId())
  );

  /**
   * Construtor do serviço.
   * Carrega o plano de assinatura salvo no `localStorage` na inicialização.
   */
  constructor() {
    this.loadSubscriptionFromStorage();
  }

  /**
   * Carrega o ID do plano de assinatura do `localStorage`.
   * @private
   */
  private loadSubscriptionFromStorage() {
    const storedPlanId = localStorage.getItem(this.storageKey);
    if (storedPlanId && ['starter', 'growth', 'pro'].includes(storedPlanId)) {
      this.currentPlanId.set(storedPlanId as 'starter' | 'growth' | 'pro');
    }
  }

  /**
   * Altera o plano de assinatura do usuário.
   * @param planId O ID do novo plano a ser ativado.
   */
  changePlan(planId: 'starter' | 'growth' | 'pro') {
    this.currentPlanId.set(planId);
    localStorage.setItem(this.storageKey, planId);
  }
}
