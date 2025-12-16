import { Injectable, signal, effect, inject } from '@angular/core';
import { RecurringTransaction } from '../models/recurring-transaction.model';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class RecurringTransactionService {
  private storageKey = 'sobrai_recurring_transactions_v1';
  recurringTransactions = signal<RecurringTransaction[]>([]);

  private transactionService = inject(TransactionService);
  private toastService = inject(ToastService);

  constructor() {
    this.loadFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recurringTransactions()));
    });
  }

  private loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.recurringTransactions.set(JSON.parse(data));
    }
  }

  add(item: Omit<RecurringTransaction, 'id'>) {
    const newItem = { ...item, id: self.crypto.randomUUID() };
    this.recurringTransactions.update(items => [...items, newItem]);
  }

  update(updatedItem: RecurringTransaction) {
    this.recurringTransactions.update(items =>
      items.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  }

  delete(id: string) {
    this.recurringTransactions.update(items => items.filter(item => item.id !== id));
  }
  
  processDueTransactions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let transactionsCreatedCount = 0;

    this.recurringTransactions.update(items => {
      return items.map(item => {
        if (!item.isActive) return item;

        let nextDueDate = new Date(item.nextDueDate);
        if (nextDueDate > today) return item;
        
        // Create transaction for the due date
        this.transactionService.addTransaction({
          type: item.type,
          description: `Recorrente: ${item.description}`,
          amount: item.amount,
          date: item.nextDueDate,
          category: item.category
        });
        transactionsCreatedCount++;

        // Calculate next due date
        const newNextDueDate = new Date(nextDueDate);
        newNextDueDate.setMonth(newNextDueDate.getMonth() + 1);

        return { ...item, nextDueDate: newNextDueDate.toISOString().split('T')[0] };
      });
    });

    if (transactionsCreatedCount > 0) {
      const message = transactionsCreatedCount === 1 
        ? '1 lançamento recorrente foi gerado.' 
        : `${transactionsCreatedCount} lançamentos recorrentes foram gerados.`;
      this.toastService.show(message, 'info');
    }
  }
}
