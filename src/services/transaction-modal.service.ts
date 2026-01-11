import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Interface que define a estrutura dos dados do formulário de transação.
 */
export interface TransactionFormData {
  description: string;
  amount: number;
  date: string;
  type: 'revenue' | 'expense';
  category?: string;
}

/**
 * Serviço para gerenciar o estado do modal de adição/edição de transações.
 *
 * Controla a visibilidade do modal, os dados iniciais para preenchimento
 * (seja para uma nova transação ou para edição), e notifica outras partes
 * da aplicação quando uma transação é salva.
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionModalService {
  /** Sinal (Signal) que controla se o modal está aberto ou fechado. */
  isModalOpen = signal<boolean>(false);

  /** Sinal (Signal) que armazena os dados iniciais para o formulário do modal. */
  initialData = signal<Partial<TransactionFormData> | null>(null);

  /** Sinal (Signal) que armazena o ID da transação que está sendo editada. */
  editingTransactionId = signal<string | null>(null);

  /** Subject para notificar quando uma transação é salva, permitindo que outros componentes reajam. */
  private transactionSavedSource = new Subject<void>();
  /** Observable que os componentes podem subscrever para serem notificados quando uma transação é salva. */
  transactionSaved$ = this.transactionSavedSource.asObservable();

  /**
   * Abre o modal de transação.
   * @param data Dados parciais para pré-preencher o formulário (opcional).
   * @param transactionId O ID da transação a ser editada (opcional).
   */
  open(data: Partial<TransactionFormData> | null = null, transactionId: string | null = null) {
    this.initialData.set(data);
    this.editingTransactionId.set(transactionId);
    this.isModalOpen.set(true);
  }

  /**
   * Fecha o modal de transação e limpa os dados de estado.
   */
  close() {
    this.isModalOpen.set(false);
    this.initialData.set(null);
    this.editingTransactionId.set(null);
  }

  /**
   * Notifica os assinantes (subscribers) de que uma transação foi salva com sucesso.
   */
  notifyTransactionSaved() {
    this.transactionSavedSource.next();
  }
}
