import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LucideIconData, Gem, ArrowLeftRight, Wallet, Target, Menu } from 'lucide-angular';
import { SidebarService } from '../../services/sidebar.service';

interface Tab {
  path: string;
  label: string;
  icon: LucideIconData;
}

/**
 * Barra de navegação inferior, só no celular (< md). Reúne os 4 destinos mais usados ao alcance do polegar;
 * "Menu" abre a gaveta com o restante das telas.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  sidebar = inject(SidebarService);
  readonly menuIcon = Menu;

  tabs: Tab[] = [
    { path: 'mixco', label: 'Início', icon: Gem },
    { path: 'mixco/fluxo', label: 'Fluxo', icon: ArrowLeftRight },
    { path: 'mixco/patrimonio', label: 'Patrimônio', icon: Wallet },
    { path: 'mixco/metas', label: 'Metas', icon: Target },
  ];
}
