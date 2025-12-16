
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private lastId = 0;

  show(message: string, type: ToastType = 'success', duration: number = 3000) {
    const id = this.lastId++;
    const newToast: Toast = { id, message, type };
    this.toasts.update(currentToasts => [...currentToasts, newToast]);

    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this.toasts.update(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }
}
