import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { OnboardingService } from '../../services/onboarding.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
  onboardingService = inject(OnboardingService);
  
  isOpen = this.sidebarService.isOpen;
  
  userName = computed(() => this.onboardingService.companyProfile()?.name || 'Usuário');

  navItems: NavItem[] = [
    { path: '/painel-principal', label: 'Painel Principal', icon: 'grid' },
    { path: '/receitas-e-despesas', label: 'Receitas e Despesas', icon: 'receipt' },
    { path: '/integracao-bancaria', label: 'Integração Bancária', icon: 'arrows-left-right' },
    { path: '/notas-fiscais', label: 'Notas Fiscais', icon: 'file-text' },
    { path: '/analise-financeira', label: 'Análise Financeira', icon: 'bar-chart' },
    { path: '/insights-ia', label: 'Insights da IA', icon: 'sparkles' },
    { path: '/relatorios', label: 'Relatórios', icon: 'bar-chart-2' },
    { path: '/assinatura', label: 'Assinatura', icon: 'credit-card' },
    { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  closeSidebar() {
    this.sidebarService.close();
  }
}
