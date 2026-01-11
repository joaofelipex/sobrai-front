import { Injectable, signal, effect, inject } from '@angular/core';
import { RecurringTransaction } from '../models/recurring-transaction.model';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';

/**
 * Serviço para gerenciar transações recorrentes.
 *
 * Responsável por adicionar, atualizar, excluir e processar transações
 * que se repetem (ex: salários, aluguéis). Persiste os dados no `localStorage`
 * e se integra com o `TransactionService` para criar as transações efetivas
 * quando a data de vencimento é atingida.
 */
@Injectable({
  providedIn: 'root'
})
export class RecurringTransactionService {
  private storageKey = 'sobrai_recurring_transactions_v1';
  
  /** Sinal (Signal) que armazena a lista de transações recorrentes. */
  recurringTransactions = signal<RecurringTransaction[]>([]);

  // Injeção de dependências.
  private transactionService = inject(TransactionService);
  private toastService = inject(ToastService);

  /**
   * Construtor do serviço.
   * Carrega as transações recorrentes do `localStorage` e configura um `effect`
   * para salvar os dados automaticamente sempre que a lista for modificada.
   */
  constructor() {
    this.loadFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recurringTransactions()));
    });
  }

  /**
   * Carrega as transações recorrentes armazenadas no `localStorage`.
   * @private
   */
  private loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.recurringTransactions.set(JSON.parse(data));
    }
  }

  /**
   * Adiciona uma nova transação recorrente à lista.
   * @param item Os dados da transação recorrente, sem o campo `id`.
   */
  add(item: Omit<RecurringTransaction, 'id'>) {
    const newItem = { ...item, id: self.crypto.randomUUID() };
    this.recurringTransactions.update(items => [...items, newItem]);
  }

  /**
   * Atualiza uma transação recorrente existente.
   * @param updatedItem O objeto da transação recorrente com os dados atualizados.
   */
  update(updatedItem: RecurringTransaction) {
    this.recurringTransactions.update(items =>
      items.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  }

  /**
   * Exclui uma transação recorrente da lista.
   * @param id O ID da transação recorrente a ser excluída.
   */
  delete(id: string) {
    this.recurringTransactions.update(items => items.filter(item => item.id !== id));
  }
  
  /**
   * Processa as transações recorrentes que estão vencidas.
   * 
   * Verifica a lista de transações recorrentes ativas e, para cada uma
   * cuja `nextDueDate` (próxima data de vencimento) seja hoje ou anterior,
   * cria uma transação normal correspondente e calcula a próxima data de vencimento.
   * Notifica o usuário sobre o número de transações geradas.
   */
  processDueTransactions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let transactionsCreatedCount = 0;

    this.recurringTransactions.update(items => {
      return items.map(item => {
        if (!item.isActive) return item;

        let nextDueDate = new Date(item.nextDueDate);
        if (nextDueDate > today) return item;
        
        // Cria a transação efetiva
        this.transactionService.addTransaction({
          type: item.type,
          description: `Recorrente: ${item.description}`,
          amount: item.amount,
          date: item.nextDueDate,
          category: item.category
        });
        transactionsCreatedCount++;

        // Calcula a próxima data de vencimento para o mês seguinte
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
