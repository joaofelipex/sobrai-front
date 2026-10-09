import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RecurringTransaction } from '../models/recurring-transaction.model';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar transações recorrentes.
 *
 * Responsável por adicionar, atualizar, excluir e processar transações
 * que se repetem (ex: salários, aluguéis). Persiste os dados na API backend
 * e se integra com o `TransactionService` para criar as transações efetivas
 * quando a data de vencimento é atingida.
 */
@Injectable({
  providedIn: 'root'
})
export class RecurringTransactionService {
  /** Chave antiga do localStorage, usada apenas para migrar dados para o backend. */
  private legacyStorageKey = 'sobrai_recurring_transactions_v1';
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendUrl}/api/recurring`;

  /** Sinal (Signal) que armazena a lista de transações recorrentes. */
  recurringTransactions = signal<RecurringTransaction[]>([]);

  // Injeção de dependências.
  private transactionService = inject(TransactionService);
  private toastService = inject(ToastService);

  /** Resolve quando a primeira carga do servidor termina (com sucesso ou erro). */
  private ready: Promise<void>;

  constructor() {
    this.ready = this.load();
  }

  /** Carrega do servidor e migra, uma única vez, dados antigos do `localStorage`. */
  private async load(): Promise<void> {
    try {
      let items = await firstValueFrom(this.http.get<RecurringTransaction[]>(this.apiUrl));
      const legacy = this.readLegacy();
      if (legacy.length > 0) {
        for (const { id: _id, ...item } of legacy) {
          await firstValueFrom(this.http.post<RecurringTransaction>(this.apiUrl, item));
        }
        localStorage.removeItem(this.legacyStorageKey);
        items = await firstValueFrom(this.http.get<RecurringTransaction[]>(this.apiUrl));
      }
      this.recurringTransactions.set(items);
    } catch (err) {
      console.error('Falha ao carregar recorrências do servidor', err);
    }
  }

  private readLegacy(): RecurringTransaction[] {
    try {
      const data = localStorage.getItem(this.legacyStorageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Adiciona uma nova transação recorrente.
   * @param item Os dados da transação recorrente, sem o campo `id`.
   */
  add(item: Omit<RecurringTransaction, 'id'>) {
    this.http.post<RecurringTransaction>(this.apiUrl, item).subscribe({
      next: (created) => this.recurringTransactions.update(items => [...items, created]),
      error: (err) => this.fail('salvar a recorrência', err)
    });
  }

  /**
   * Atualiza uma transação recorrente existente.
   * @param updatedItem O objeto da transação recorrente com os dados atualizados.
   */
  update(updatedItem: RecurringTransaction) {
    this.http.put<RecurringTransaction>(`${this.apiUrl}/${updatedItem.id}`, updatedItem).subscribe({
      next: (saved) => this.recurringTransactions.update(items =>
        items.map(item => item.id === saved.id ? saved : item)
      ),
      error: (err) => this.fail('atualizar a recorrência', err)
    });
  }

  /**
   * Exclui uma transação recorrente.
   * @param id O ID da transação recorrente a ser excluída.
   */
  delete(id: string) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.recurringTransactions.update(items => items.filter(item => item.id !== id)),
      error: (err) => this.fail('excluir a recorrência', err)
    });
  }

  /**
   * Processa as transações recorrentes que estão vencidas.
   *
   * Para cada recorrência ativa cuja `nextDueDate` seja hoje ou anterior, cria uma
   * transação para cada mês em atraso e avança a próxima data de vencimento.
   * Notifica o usuário sobre o número de transações geradas.
   */
  async processDueTransactions(): Promise<void> {
    await this.ready;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let created = 0;

    for (const item of this.recurringTransactions()) {
      if (!item.isActive) continue;

      let due = new Date(item.nextDueDate);
      if (due > today) continue;

      const iso = (d: Date) => d.toISOString().split('T')[0];
      const pending: string[] = [];
      while (due <= today) {
        pending.push(iso(due));
        due = new Date(due);
        due.setMonth(due.getMonth() + 1);
      }

      // Avança a data primeiro: se falhar, nada é lançado e a próxima abertura tenta de novo.
      try {
        const saved = await firstValueFrom(
          this.http.put<RecurringTransaction>(`${this.apiUrl}/${item.id}`, { ...item, nextDueDate: iso(due) })
        );
        this.recurringTransactions.update(items => items.map(i => i.id === saved.id ? saved : i));
      } catch (err) {
        this.fail('processar a recorrência', err);
        continue;
      }

      for (const date of pending) {
        this.transactionService.addTransaction({
          type: item.type,
          description: `Recorrente: ${item.description}`,
          amount: item.amount,
          date,
          category: item.category
        });
        created++;
      }
    }

    if (created > 0) {
      const message = created === 1
        ? '1 lançamento recorrente foi gerado.'
        : `${created} lançamentos recorrentes foram gerados.`;
      this.toastService.show(message, 'info');
    }
  }

  private fail(action: string, err: unknown) {
    console.error(`Falha ao ${action}`, err);
    this.toastService.showError(`Não foi possível ${action}.`);
  }
}
