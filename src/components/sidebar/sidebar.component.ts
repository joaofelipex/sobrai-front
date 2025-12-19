import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  private readonly router = inject(Router);

  isOpen = this.sidebarService.isOpen;

  userName = computed(() => this.onboardingService.companyProfile()?.name || 'Usuário');

  navItems: NavItem[] = [
    { path: 'painel-principal', label: 'Painel Principal', icon: 'grid' },
    { path: 'receitas-e-despesas', label: 'Receitas e Despesas', icon: 'receipt' },
    { path: 'recorrencias', label: 'Recorrências', icon: 'repeat' },
    { path: 'integracao-bancaria', label: 'Integração Bancária', icon: 'arrows-left-right' },
    { path: 'notas-fiscais', label: 'Notas Fiscais', icon: 'file-text' },
    { path: 'analise-financeira', label: 'Análise Financeira', icon: 'bar-chart' },
    { path: 'insights-ia', label: 'Insights da IA', icon: 'sparkles' },
    { path: 'metas', label: 'Metas', icon: 'target' },
    { path: 'relatorios', label: 'Relatórios', icon: 'bar-chart-2' },
    { path: 'assinatura', label: 'Assinatura', icon: 'credit-card' },
    { path: 'configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  closeSidebar() {
    this.sidebarService.close();
  }

  logout(): void {
    try {
      // Remove apenas dados do app (evita apagar storage de outros sites/projetos)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sobrai_')) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }

      // Reseta estado em memória
      this.onboardingService.companyProfile.set(null);
      this.onboardingService.isOnboardingComplete.set(false);

      this.closeSidebar();
      void this.router.navigateByUrl('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      this.closeSidebar();
      void this.router.navigateByUrl('/');
    }
  }
}