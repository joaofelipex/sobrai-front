import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { OnboardingService } from '../../services/onboarding.service';

/**
 * Interface para definir a estrutura de um item de navegação.
 */
interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Componente da barra lateral (sidebar).
 * Gerencia a exibição e o comportamento do menu de navegação principal.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  // Injeção de dependências dos serviços necessários.
  sidebarService = inject(SidebarService);
  onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  // Signal que controla o estado de abertura/fechamento do sidebar.
  isOpen = this.sidebarService.isOpen;

  // Signal computado que obtém o nome do usuário/empresa do serviço de onboarding.
  userName = computed(() => this.onboardingService.companyProfile()?.name || 'Usuário');

  // Array com os itens de navegação do menu.
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

  /**
   * Fecha o sidebar chamando o método correspondente no SidebarService.
   */
  closeSidebar() {
    this.sidebarService.close();
  }

  /**
   * Realiza o logout do usuário.
   * Limpa os dados da aplicação do localStorage, reseta os signals de estado
   * e redireciona para a página inicial.
   */
  logout(): void {
    try {
      // Remove apenas as chaves do localStorage que começam com 'sobrai_' para evitar apagar dados de outras aplicações.
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

      // Reseta os signals de estado do onboarding para o estado inicial.
      this.onboardingService.companyProfile.set(null);
      this.onboardingService.isOnboardingComplete.set(false);

      // Fecha o sidebar e navega para a página inicial.
      this.closeSidebar();
      void this.router.navigateByUrl('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Garante que o usuário seja deslogado mesmo em caso de erro.
      this.closeSidebar();
      void this.router.navigateByUrl('/');
    }
  }
}
