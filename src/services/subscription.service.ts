import { Injectable, signal, computed } from '@angular/core';
import { SubscriptionPlan } from '../models/subscription.model';

export interface BillingHistoryItem {
  date: string;
  planName: string;
  amount: number;
  status: 'paid' | 'failed';
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private storageKey = 'sobrai_subscription_v1';
  
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

  billingHistory = signal<BillingHistoryItem[]>([
      { date: '2024-05-01', planName: 'Starter', amount: 49.00, status: 'paid' },
      { date: '2024-04-01', planName: 'Starter', amount: 49.00, status: 'paid' },
      { date: '2024-03-01', planName: 'Starter', amount: 49.00, status: 'paid' },
  ]);

  currentPlanId = signal<'starter' | 'growth' | 'pro'>('starter');

  currentPlan = computed(() => 
    this.availablePlans().find(p => p.id === this.currentPlanId())
  );

  constructor() {
    this.loadSubscriptionFromStorage();
  }

  private loadSubscriptionFromStorage() {
    const storedPlanId = localStorage.getItem(this.storageKey);
    if (storedPlanId && ['starter', 'growth', 'pro'].includes(storedPlanId)) {
      this.currentPlanId.set(storedPlanId as 'starter' | 'growth' | 'pro');
    }
  }

  changePlan(planId: 'starter' | 'growth' | 'pro') {
    this.currentPlanId.set(planId);
    localStorage.setItem(this.storageKey, planId);
  }
}
