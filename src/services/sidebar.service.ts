import { Injectable, signal } from '@angular/core';

/**
 * Serviço para gerenciar o estado da barra lateral (sidebar).
 * Controla se o sidebar está aberto ou fechado em toda a aplicação.
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  /**
   * Signal que armazena o estado de visibilidade do sidebar.
   * `true` se estiver aberto, `false` se estiver fechado.
   */
  isOpen = signal(false);

  /**
   * Alterna o estado do sidebar (aberto/fechado).
   */
  toggle() {
    this.isOpen.update(value => !value);
  }

  /**
   * Força o fechamento do sidebar.
   */
  close() {
    this.isOpen.set(false);
  }
}