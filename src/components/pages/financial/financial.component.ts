
import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { ToastService } from '../../../services/toast.service';
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
  route = inject(ActivatedRoute);
  datePipe = inject(DatePipe);

  isModalOpen = signal(false);
  editingTransactionId = signal<string | null>(null);

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

  ngOnInit() {
    this.resetForm();
    this.route.paramMap.subscribe(params => {
      const filterParam = params.get('filter');
      if (filterParam === 'revenue' || filterParam === 'expense') {
        this.filter.set(filterParam);
      }
    });
  }

  openModal(transactionId: string | null = null) {
    if (transactionId) {
      const transactionToEdit = this.transactionService.getTransactionById(transactionId);
      if (transactionToEdit) {
        this.editingTransactionId.set(transactionId);
        this.transactionForm.set({ ...transactionToEdit });
      }
    } else {
      this.resetForm();
      this.editingTransactionId.set(null);
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
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
}
