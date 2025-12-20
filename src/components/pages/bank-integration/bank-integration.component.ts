import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionModalService, TransactionFormData } from '../../../services/transaction-modal.service';
import { Subscription } from 'rxjs';

interface MockBankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  imported: boolean;
}

@Component({
  selector: 'app-bank-integration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-integration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankIntegrationComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private transactionModalService = inject(TransactionModalService);

  connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  mockTransactions = signal<MockBankTransaction[]>([]);

  private transactionToImportId = signal<string | null>(null);
  private subscription: Subscription | undefined;

  connectBank() {
    this.connectionStatus.set('connecting');
    setTimeout(() => {
      this.connectionStatus.set('connected');
      this.loadMockTransactions();
    }, 2000);
  }

  disconnectBank() {
    this.connectionStatus.set('disconnected');
    this.mockTransactions.set([]);
  }

  loadMockTransactions() {
    this.mockTransactions.set([
      { id: '1', date: '2023-10-26', description: 'Pix Recebido - Empresa A', amount: 1200, type: 'credit', imported: false },
      { id: '2', date: '2023-10-25', description: 'Pagamento Fornecedor B', amount: -350, type: 'debit', imported: true },
      { id: '3', date: '2023-10-25', description: 'Compra Online - Amazon', amount: -89.90, type: 'debit', imported: false },
      { id: '4', date: '2023-10-24', description: 'Transferência TED - Cliente C', amount: 2500, type: 'credit', imported: false },
      { id: '5', date: '2023-10-23', description: 'Pagamento de Conta - Energia', amount: -150.75, type: 'debit', imported: false },
    ]);
  }

  ngOnInit(): void {
    this.subscription = this.transactionModalService.transactionSaved$.subscribe(() => {
      if (this.transactionToImportId()) {
        this.mockTransactions.update(transactions => 
          transactions.map(t => t.id === this.transactionToImportId() ? { ...t, imported: true } : t)
        );
        this.transactionToImportId.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  importTransaction(transactionId: string) {
    const transaction = this.mockTransactions().find(t => t.id === transactionId);
    if (!transaction) return;

    this.transactionToImportId.set(transactionId);

    const transactionData: Partial<TransactionFormData> = {
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      date: transaction.date,
      type: transaction.type === 'credit' ? 'revenue' : 'expense',
    };

    this.transactionModalService.open(transactionData);
    this.router.navigate(['/receitas-e-despesas']);
  }
}
