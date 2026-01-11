
import { Injectable, signal } from '@angular/core';

/**
 * Define o tipo para o período de visualização, que pode ser 'mês' ou 'ano'.
 */
export type Period = 'month' | 'year';

/**
 * Serviço para gerenciar o período de visualização selecionado pelo usuário.
 *
 * Este serviço centraliza o estado do período (mês ou ano) que é usado
 * em vários componentes da aplicação para filtrar ou agregar dados financeiros.
 */
@Injectable({
  providedIn: 'root',
})
export class PeriodService {
  /**
   * Sinal (Signal) que armazena o período de visualização atual.
   * O valor padrão é 'mês'.
   * @private
   */
  private period = signal<Period>('month');

  /**
   * Retorna o período de visualização atual como um sinal de leitura (readonly signal).
   *
   * Os componentes podem usar este método para obter acesso reativo ao período
   * e serem notificados quando ele mudar.
   *
   * @returns Um `Signal` de apenas leitura contendo o período atual ('month' or 'year').
   */
  getPeriod() {
    return this.period.asReadonly();
  }

  /**
   * Define o período de visualização.
   *
   * @param period O novo período a ser definido ('month' or 'year').
   */
  setPeriod(period: Period) {
    this.period.set(period);
  }
}
