import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface TransactionFormData {
  description: string;
  amount: number;
  date: string;
  type: 'revenue' | 'expense';
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionModalService {
  isModalOpen = signal<boolean>(false);
  initialData = signal<Partial<TransactionFormData> | null>(null);
  editingTransactionId = signal<string | null>(null);

  private transactionSavedSource = new Subject<void>();
  transactionSaved$ = this.transactionSavedSource.asObservable();

  open(data: Partial<TransactionFormData> | null = null, transactionId: string | null = null) {
    this.initialData.set(data);
    this.editingTransactionId.set(transactionId);
    this.isModalOpen.set(true);
  }

  close() {
    this.isModalOpen.set(false);
    this.initialData.set(null);
    this.editingTransactionId.set(null);
  }

  notifyTransactionSaved() {
    this.transactionSavedSource.next();
  }
}
