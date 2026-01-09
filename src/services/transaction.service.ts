import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models/transaction.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendUrl}/api`;

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

  balanceHistory = computed(() => {
    const transactions = this.transactions();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const olderTransactions = transactions.filter(t => new Date(t.date) < thirtyDaysAgo);
    let cumulativeBalance = olderTransactions.reduce((acc, t) => {
        return acc + (t.type === 'revenue' ? t.amount : -t.amount);
    }, 0);

    const historyData: { date: Date, balance: number }[] = [];
    
    for (let i = 0; i <= 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        
        const dailyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === date.getFullYear() &&
                   tDate.getMonth() === date.getMonth() &&
                   tDate.getDate() === date.getDate();
        });

        const dailyChange = dailyTransactions.reduce((acc, t) => {
            return acc + (t.type === 'revenue' ? t.amount : -t.amount);
        }, 0);

        cumulativeBalance += dailyChange;
        historyData.push({ date: date, balance: cumulativeBalance });
    }
    
    // Select 7 data points for the chart for better readability
    const chartData = [];
    for (let i = 0; i < historyData.length; i+=5) {
        const item = historyData[i];
         chartData.push({
            name: `${item.date.getDate().toString().padStart(2, '0')}/${(item.date.getMonth() + 1).toString().padStart(2, '0')}`,
            'Saldo': item.balance,
        });
    }

    // Ensure the last day is always included
    const lastDay = historyData[historyData.length - 1];
    if (chartData[chartData.length -1].name !== `${lastDay.date.getDate().toString().padStart(2, '0')}/${(lastDay.date.getMonth() + 1).toString().padStart(2, '0')}`) {
        chartData.push({
           name: `${lastDay.date.getDate().toString().padStart(2, '0')}/${(lastDay.date.getMonth() + 1).toString().padStart(2, '0')}`,
           'Saldo': lastDay.balance
       });
    }

    return chartData;
  });

  constructor() {
    this.loadTransactionsFromServer();
  }

  private loadTransactionsFromServer() {
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (data) => {
        this.transactions.set(this.sortTransactions(data));
      },
      error: (err) => {
        console.error('Failed to load transactions from server', err);
        // Optionally, load from local storage as a fallback or show an error
      }
    });
  }
  
  private sortTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addTransaction(transaction: Omit<Transaction, 'id'>) {
    this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction).subscribe({
      next: (newTransaction) => {
        this.transactions.update(transactions => this.sortTransactions([...transactions, newTransaction]));
      },
      error: (err) => console.error('Failed to add transaction', err)
    });
  }

  updateTransaction(updatedTransaction: Transaction) {
    this.http.put<Transaction>(`${this.apiUrl}/transactions/${updatedTransaction.id}`, updatedTransaction).subscribe({
      next: (result) => {
        this.transactions.update(transactions => 
          this.sortTransactions(transactions.map(t => t.id === updatedTransaction.id ? result : t))
        );
      },
      error: (err) => console.error('Failed to update transaction', err)
    });
  }

  deleteTransaction(id: string) {
    this.http.delete(`${this.apiUrl}/transactions/${id}`).subscribe({
      next: () => {
        this.transactions.update(transactions => transactions.filter(t => t.id !== id));
      },
      error: (err) => console.error('Failed to delete transaction', err)
    });
  }
  
  getTransactionById(id: string): Transaction | undefined {
    return this.transactions().find(t => t.id === id);
  }
}