import { Injectable, signal, computed } from '@angular/core';

/**
 * Define os tipos de notificação (toast) que podem ser exibidos.
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Interface que define a estrutura de um objeto de notificação (toast).
 */
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timestamp: number;
}

/**
 * Serviço para gerenciar a exibição de notificações (toasts) na aplicação.
 *
 * Permite exibir mensagens temporárias de sucesso, erro ou informação
 * de forma centralizada.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  /**
   * Sinal (Signal) privado que armazena a lista de toasts ativos.
   * @private
   */
  private _toasts = signal<Toast[]>([]);
  private lastId = 0;

  /** Sinal (Signal) de apenas leitura que expõe a lista de toasts ativos. */
  toasts = this._toasts.asReadonly();
  
  /** Sinal computado (Computed Signal) que retorna o número de toasts ativos. */
  activeToasts = computed(() => this._toasts().length);

  /**
   * Exibe uma notificação. Este é o método principal que os métodos de conveniência utilizam.
   *
   * @param message A mensagem a ser exibida.
   * @param type O tipo de notificação ('success', 'error', 'info'). O padrão é 'success'.
   * @param duration A duração em milissegundos que a notificação ficará visível. Se 0, não será removida automaticamente. O padrão é 5000.
   * @returns O ID da notificação criada, para referência futura (ex: para remoção manual).
   */
  show(message: string, type: ToastType = 'success', duration: number = 5000): number {
    const id = this.lastId++;
    const newToast: Toast = { 
      id, 
      message, 
      type,
      timestamp: Date.now()
    };
    
    // Adiciona o novo toast ao início do array para que apareça no topo
    this._toasts.update(currentToasts => [newToast, ...currentToasts]);
    
    // Remove o toast após o tempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  // --- Métodos de Conveniência ---

  /**
   * Exibe uma notificação de sucesso.
   * @param message A mensagem de sucesso.
   * @param duration Duração em milissegundos. Padrão de 3000ms.
   */
  showSuccess(message: string, duration: number = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Exibe uma notificação de erro.
   * @param message A mensagem de erro.
   * @param duration Duração em milissegundos. Padrão de 8000ms para dar mais tempo de leitura.
   */
  showError(message: string, duration: number = 8000) {
    return this.show(message, 'error', duration);
  }
  
  /**
   * Exibe uma notificação de informação.
   * @param message A mensagem informativa.
   * @param duration Duração em milissegundos. Padrão de 5000ms.
   */
  showInfo(message: string, duration: number = 5000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Remove uma notificação específica pelo seu ID.
   * @param id O ID da notificação a ser removida.
   */
  remove(id: number) {
    this._toasts.update(currentToasts => 
      currentToasts.filter(toast => toast.id !== id)
    );
  }
  
  /**
   * Remove todas as notificações da tela.
   */
  clear() {
    this._toasts.set([]);
  }
  
  /**
   * Atualiza uma notificação existente, útil para processos em andamento.
   * @param id O ID da notificação a ser atualizada.
   * @param message A nova mensagem.
   * @param type O novo tipo (opcional).
   */
  update(id: number, message: string, type?: ToastType) {
    this._toasts.update(currentToasts => {
      const index = currentToasts.findIndex(t => t.id === id);
      if (index !== -1) {
        const updatedToasts = [...currentToasts];
        updatedToasts[index] = { 
          ...updatedToasts[index], 
          message,
          type: type || updatedToasts[index].type
        };
        return updatedToasts;
      }
      return currentToasts;
    });
  }
}
