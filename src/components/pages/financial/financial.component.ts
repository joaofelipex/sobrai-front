import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { ToastService } from '../../../services/toast.service';
import { TransactionModalService } from '../../../services/transaction-modal.service';
import { Transaction, ExpenseCategories, RevenueCategories } from '../../../models/transaction.model';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './financial.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialComponent implements OnInit {
  transactionService = inject(TransactionService);
  toastService = inject(ToastService);
  transactionModalService = inject(TransactionModalService);
  route = inject(ActivatedRoute);
  datePipe = inject(DatePipe);

  isModalOpen = this.transactionModalService.isModalOpen;
  editingTransactionId = this.transactionModalService.editingTransactionId;

  // Filtros
  filter = signal<'all' | 'revenue' | 'expense'>('all');
  
  filteredTransactions = computed(() => {
    const transactions = this.transactionService.transactions();
    const currentFilter = this.filter();
    if (currentFilter === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.type === currentFilter);
  });

  transactionForm = signal<Omit<Transaction, 'id'>>({
    type: 'expense', description: '', amount: 0, date: '', category: ''
  });
  
  categories = computed(() => 
    this.transactionForm().type === 'expense' ? ExpenseCategories : RevenueCategories
  );

  constructor() {
    effect(() => {
      if (this.isModalOpen()) {
        const initialData = this.transactionModalService.initialData();
        const editingId = this.editingTransactionId();

        if (editingId && !initialData) {
          const transactionToEdit = this.transactionService.getTransactionById(editingId);
          if (transactionToEdit) {
            this.transactionForm.set({ ...transactionToEdit });
          }
        } else if (initialData) {
          this.transactionForm.set({
            type: initialData.type || 'expense',
            description: initialData.description || '',
            amount: initialData.amount || 0,
            date: initialData.date || this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
            category: initialData.category || 'Outros',
          });
        } else {
          this.resetForm();
        }
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const filterParam = params.get('filter');
      if (filterParam === 'revenue' || filterParam === 'expense') {
        this.filter.set(filterParam);
      }
    });
  }

  openModal(transactionId: string | null = null) {
    this.transactionModalService.open(null, transactionId);
  }

  closeModal() {
    this.transactionModalService.close();
  }

  resetForm() {
    this.transactionForm.set({
      type: 'expense',
      description: '',
      amount: 0,
      date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      category: 'Outros'
    });
  }

  saveTransaction() {
    const formValue = this.transactionForm();
    if (!formValue.description || formValue.amount <= 0 || !formValue.date) return;

    if (this.editingTransactionId()) {
      this.transactionService.updateTransaction({ id: this.editingTransactionId()!, ...formValue });
      this.toastService.show('Transação atualizada com sucesso!');
    } else {
      this.transactionService.addTransaction(formValue);
      this.toastService.show('Transação adicionada com sucesso!');
    }
    this.transactionModalService.notifyTransactionSaved();
    this.closeModal();
  }

  deleteTransaction(id: string) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      this.transactionService.deleteTransaction(id);
      this.toastService.show('Transação excluída.', 'info');
    }
  }

  setFilter(filter: 'all' | 'revenue' | 'expense') {
    this.filter.set(filter);
  }

  setTransactionType(type: 'revenue' | 'expense') {
    this.transactionForm.update(form => ({ ...form, type }));
  }
}