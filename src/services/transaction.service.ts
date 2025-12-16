
import { Injectable, signal, effect, computed } from '@angular/core';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private storageKey = 'sobrai_transactions_v1';
  transactions = signal<Transaction[]>([]);

  totalRevenue = computed(() => 
    this.transactions()
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  totalExpenses = computed(() =>
    this.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  
  balance = computed(() => this.totalRevenue() - this.totalExpenses());

  constructor() {
    this.loadTransactionsFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.transactions()));
    });
  }

  private loadTransactionsFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.transactions.set(JSON.parse(data));
    }
  }
  
  private sortTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addTransaction(transaction: Omit<Transaction, 'id'>) {
    const newTransaction = { ...transaction, id: self.crypto.randomUUID() };
    this.transactions.update(transactions => this.sortTransactions([...transactions, newTransaction]));
  }

  updateTransaction(updatedTransaction: Transaction) {
    this.transactions.update(transactions => 
      this.sortTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  }

  deleteTransaction(id: string) {
    this.transactions.update(transactions => transactions.filter(t => t.id !== id));
  }
  
  getTransactionById(id: string): Transaction | undefined {
    return this.transactions().find(t => t.id === id);
  }
}
