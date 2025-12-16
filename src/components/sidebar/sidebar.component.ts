
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
  userInitials = computed(() => {
    const name = this.userName().split(' ');
    const first = name[0]?.[0] || '';
    const last = name.length > 1 ? name[name.length - 1]?.[0] : '';
    return `${first}${last}`.toUpperCase();
  });


  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/notas-fiscais', label: 'Notas Fiscais', icon: 'file-text' },
    { path: '/financeiro', label: 'Financeiro', icon: 'dollar-sign' },
    { path: '/relatorios', label: 'Relatórios', icon: 'bar-chart-2' },
    { path: '/metas', label: 'Metas', icon: 'target' },
    { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  closeSidebar() {
    this.sidebarService.close();
  }
}
