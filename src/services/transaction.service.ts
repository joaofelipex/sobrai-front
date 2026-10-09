import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models/transaction.model';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar as transações financeiras (receitas e despesas).
 *
 * Responsável por carregar, adicionar, atualizar e excluir transações,
 * interagindo com a API backend. Também calcula totais de receitas,
 * despesas, saldo atual e um histórico de saldo para gráficos.
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.backendUrl}/api`;

  /** Sinal (Signal) que armazena a lista de todas as transações. */
  transactions = signal<Transaction[]>([]);

  /** Sinal computado (Computed Signal) que calcula o total de receitas. */
  totalRevenue = computed(() => 
    this.transactions()
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  /** Sinal computado (Computed Signal) que calcula o total de despesas. */
  totalExpenses = computed(() =>
    this.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  
  /** Sinal computado (Computed Signal) que calcula o saldo atual (receitas - despesas). */
  balance = computed(() => this.totalRevenue() - this.totalExpenses());

  /**
   * Sinal computado (Computed Signal) que gera um histórico de saldo dos últimos 30 dias.
   * Usado para alimentar gráficos de evolução de saldo.
   */
  balanceHistory = computed(() => {
    const transactions = this.transactions();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Calcula o saldo inicial acumulado de todas as transações anteriores a 30 dias atrás
    const olderTransactions = transactions.filter(t => new Date(t.date) < thirtyDaysAgo);
    let cumulativeBalance = olderTransactions.reduce((acc, t) => {
        return acc + (t.type === 'revenue' ? t.amount : -t.amount);
    }, 0);

    const historyData: { date: Date, balance: number }[] = [];
    
    // Itera sobre os últimos 30 dias para construir o histórico diário
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
    
    // Seleciona ~7 pontos de dados para melhor legibilidade do gráfico
    const chartData = [];
    for (let i = 0; i < historyData.length; i+=5) {
        const item = historyData[i];
         chartData.push({
            name: `${item.date.getDate().toString().padStart(2, '0')}/${(item.date.getMonth() + 1).toString().padStart(2, '0')}`,
            'Saldo': item.balance,
        });
    }

    // Garante que o último dia seja sempre incluído nos dados do gráfico
    const lastDay = historyData[historyData.length - 1];
    if (chartData.length > 0 && chartData[chartData.length - 1].name !== `${lastDay.date.getDate().toString().padStart(2, '0')}/${(lastDay.date.getMonth() + 1).toString().padStart(2, '0')}`) {
        chartData.push({
           name: `${lastDay.date.getDate().toString().padStart(2, '0')}/${(lastDay.date.getMonth() + 1).toString().padStart(2, '0')}`,
           'Saldo': lastDay.balance
       });
    }

    return chartData;
  });

  /**
   * Construtor do serviço.
   * Carrega as transações do servidor na inicialização.
   */
  constructor() {
    this.loadTransactionsFromServer();
  }

  /**
   * Carrega as transações a partir do servidor via GET request.
   * @private
   */
  private loadTransactionsFromServer() {
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (data) => {
        this.transactions.set(this.sortTransactions(data));
      },
      error: (err) => {
        console.error('Falha ao carregar transações do servidor', err);
        this.toastService.showError('Não foi possível carregar as transações.');
      }
    });
  }
  
  /**
   * Ordena as transações pela data, da mais recente para a mais antiga.
   * @param transactions Array de transações a ser ordenado.
   * @returns O array de transações ordenado.
   * @private
   */
  private sortTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Adiciona uma nova transação.
   * @param transaction Dados da transação a ser adicionada (sem o 'id').
   */
  addTransaction(transaction: Omit<Transaction, 'id'>) {
    this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction).subscribe({
      next: (newTransaction) => {
        this.transactions.update(transactions => this.sortTransactions([...transactions, newTransaction]));
      },
      error: (err) => {
        console.error('Falha ao adicionar transação', err);
        this.toastService.showError('Não foi possível adicionar a transação.');
      }
    });
  }

  /**
   * Atualiza uma transação existente.
   * @param updatedTransaction Objeto da transação com os dados atualizados.
   */
  updateTransaction(updatedTransaction: Transaction) {
    this.http.put<Transaction>(`${this.apiUrl}/transactions/${updatedTransaction.id}`, updatedTransaction).subscribe({
      next: (result) => {
        this.transactions.update(transactions => 
          this.sortTransactions(transactions.map(t => t.id === updatedTransaction.id ? result : t))
        );
      },
      error: (err) => {
        console.error('Falha ao atualizar transação', err);
        this.toastService.showError('Não foi possível atualizar a transação.');
      }
    });
  }

  /**
   * Exclui uma transação pelo seu ID.
   * @param id O ID da transação a ser excluída.
   */
  deleteTransaction(id: string) {
    this.http.delete(`${this.apiUrl}/transactions/${id}`).subscribe({
      next: () => {
        this.transactions.update(transactions => transactions.filter(t => t.id !== id));
      },
      error: (err) => {
        console.error('Falha ao excluir transação', err);
        this.toastService.showError('Não foi possível excluir a transação.');
      }
    });
  }
  
  /**
   * Busca uma transação pelo seu ID.
   * @param id O ID da transação.
   * @returns A transação encontrada ou `undefined`.
   */
  getTransactionById(id: string): Transaction | undefined {
    return this.transactions().find(t => t.id === id);
  }
}