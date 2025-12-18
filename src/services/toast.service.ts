
import { Injectable, signal, computed } from '@angular/core';

console.log('ToastService: Carregando serviço de notificações...');

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private lastId = 0;

  // Expor o sinal como somente leitura
  toasts = this._toasts.asReadonly();
  
  // Contador de toasts ativos
  activeToasts = computed(() => this._toasts().length);

  constructor() {
    console.log('ToastService: Serviço inicializado');
  }

  showError(message: string, duration: number = 5000) {
    return this.show(message, 'error', duration);
  }

  showSuccess(message: string, duration: number = 3000) {
    return this.show(message, 'success', duration);
  }

  show(message: string, type: ToastType = 'success', duration: number = 5000) {
    try {
      console.log(`ToastService: Exibindo notificação [${type}]: ${message}`);
      
      const id = this.lastId++;
      const newToast: Toast = { 
        id, 
        message, 
        type,
        timestamp: Date.now()
      };
      
      // Adiciona o novo toast ao início do array para que apareça no topo
      this._toasts.update(currentToasts => [newToast, ...currentToasts]);
      
      console.log(`ToastService: Notificação adicionada. Total de notificações: ${this.activeToasts()}`);
      
      // Remove o toast após o tempo especificado
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, duration);
      }
      
      return id;
    } catch (error) {
      console.error('ToastService: Erro ao exibir notificação:', error);
      return -1;
    }
  }

  // Métodos de conveniência para tipos específicos
  success(message: string, duration: number = 5000) {
    return this.show(message, 'success', duration);
  }
  
  error(message: string, duration: number = 8000) {
    return this.show(message, 'error', duration);
  }
  
  info(message: string, duration: number = 5000) {
    return this.show(message, 'info', duration);
  }

  remove(id: number) {
    console.log(`ToastService: Removendo notificação #${id}`);
    this._toasts.update(currentToasts => {
      const newToasts = currentToasts.filter(toast => toast.id !== id);
      console.log(`ToastService: Notificação #${id} removida. Restantes: ${newToasts.length}`);
      return newToasts;
    });
  }
  
  // Remove todas as notificações
  clear() {
    console.log('ToastService: Removendo todas as notificações');
    this._toasts.set([]);
  }
  
  // Atualiza uma notificação existente
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
