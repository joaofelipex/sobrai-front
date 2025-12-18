// FIX: Import 'computed' from '@angular/core' to resolve reference error.
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecurringTransactionService } from '../../../services/recurring-transaction.service';
import { RecurringTransaction } from '../../../models/recurring-transaction.model';
import { ToastService } from '../../../services/toast.service';
import { ExpenseCategories, RevenueCategories } from '../../../models/transaction.model';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './recurring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringComponent {
  recurringService = inject(RecurringTransactionService);
  toastService = inject(ToastService);
  datePipe = inject(DatePipe);

  isModalOpen = signal(false);
  editingTransactionId = signal<string | null>(null);

  form = signal<Omit<RecurringTransaction, 'id'>>({
    description: '',
    amount: 100,
    type: 'expense',
    category: 'Software',
    frequency: 'monthly',
    startDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
    nextDueDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
    isActive: true,
  });

  categories = computed(() =>
    this.form().type === 'expense' ? ExpenseCategories : RevenueCategories
  );

  updateFormType(type: 'expense' | 'revenue') {
    this.form.update(f => ({
      ...f,
      type,
      category: type === 'expense' ? 'Software' : 'Vendas'
    }));
  }

  openModal(item: RecurringTransaction | null = null) {
    if (item) {
      this.editingTransactionId.set(item.id);
      this.form.set({ ...item });
    } else {
      this.editingTransactionId.set(null);
      this.resetForm();
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  resetForm() {
    this.form.set({
      description: '',
      amount: 100,
      type: 'expense',
      category: 'Software',
      frequency: 'monthly',
      startDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
      nextDueDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
      isActive: true,
    });
  }

  save() {
    const formValue = this.form();
    if (this.editingTransactionId()) {
      this.recurringService.update({ id: this.editingTransactionId()!, ...formValue });
      this.toastService.show('Recorrência atualizada com sucesso!');
    } else {
      this.recurringService.add(formValue);
      this.toastService.show('Recorrência adicionada com sucesso!');
    }
    this.closeModal();
  }
  
  toggleActive(item: RecurringTransaction) {
    this.recurringService.update({ ...item, isActive: !item.isActive });
    const toastMessage = `Recorrência ${!item.isActive ? 'ativada' : 'desativada'}.`;
    this.toastService.show(toastMessage, 'info');
  }

  delete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta recorrência?')) {
      this.recurringService.delete(id);
      this.toastService.show('Recorrência excluída.', 'info');
    }
  }
}
