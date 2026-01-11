import { Injectable, signal, effect } from '@angular/core';

/**
 * Define os tipos de temas disponíveis na aplicação.
 * - 'light': Tema claro
 * - 'dark': Tema escuro
 * - 'system': Usa a preferência de tema do sistema operacional
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Serviço para gerenciar o tema da aplicação.
 *
 * Responsável por aplicar, alterar e persistir a preferência de tema do usuário
 * (claro, escuro ou padrão do sistema).
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'sobrai_theme_v1';

  /**
   * Sinal (Signal) que armazena a preferência de tema do usuário.
   * O valor inicial é carregado do `localStorage` ou definido como 'system' por padrão.
   */
  theme = signal<Theme>(this.getInitialTheme());

  /**
   * Construtor do serviço.
   * Configura um `effect` para reagir a mudanças no tema e aplicar as classes CSS
   * apropriadas no `document.documentElement`. Também salva a preferência no `localStorage`.
   */
  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem(this.storageKey, currentTheme);
      this.updateThemeClass(currentTheme);
    });
  }

  /**
   * Obtém o tema inicial do `localStorage` ou define 'system' como padrão.
   * @returns O tema salvo ou 'system'.
   * @private
   */
  private getInitialTheme(): Theme {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(this.storageKey);
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        return storedTheme as Theme;
      }
    }
    return 'system';
  }

  /**
   * Atualiza a classe CSS no elemento `<html>` para refletir o tema selecionado.
   * Lida com a lógica de detecção automática do tema do sistema.
   * @param theme O tema a ser aplicado.
   * @private
   */
  private updateThemeClass(theme: Theme) {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      root.classList.remove(isDark ? 'light' : 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
    }
  }

  /**
   * Define o tema da aplicação.
   * @param theme O novo tema a ser definido.
   */
  setTheme(theme: Theme) {
    this.theme.set(theme);
  }
}
