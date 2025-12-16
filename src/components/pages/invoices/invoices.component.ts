
import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice } from '../../../models/invoice.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent implements OnInit {
  invoiceService = inject(InvoiceService);
  datePipe = inject(DatePipe);

  isModalOpen = signal(false);
  filter = signal<'all' | 'issued' | 'paid' | 'canceled'>('all');

  filteredInvoices = computed(() => {
    const invoices = this.invoiceService.invoices();
    const currentFilter = this.filter();
    if (currentFilter === 'all') {
      return invoices;
    }
    return invoices.filter(inv => inv.status === currentFilter);
  });

  newInvoiceForm = signal<Omit<Invoice, 'id' | 'taxAmount' | 'status'>>({
    clientName: '',
    clientDocument: '',
    description: '',
    amount: 0,
    issueDate: '',
  });

  ngOnInit() {
    this.resetForm();
  }

  openModal() {
    this.resetForm();
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
  
  resetForm() {
     this.newInvoiceForm.set({
      clientName: '',
      clientDocument: '',
      description: 'Prestação de serviços de consultoria',
      amount: 1000,
      issueDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
    });
  }

  saveInvoice() {
    const formValue = this.newInvoiceForm();
    if (!formValue.clientName || !formValue.description || formValue.amount <= 0 || !formValue.issueDate) {
      return;
    }
    this.invoiceService.addInvoice(formValue);
    this.closeModal();
  }
  
  updateStatus(id: string, status: 'paid' | 'canceled') {
    this.invoiceService.updateInvoiceStatus(id, status);
  }

  setFilter(filter: 'all' | 'issued' | 'paid' | 'canceled') {
    this.filter.set(filter);
  }
}
