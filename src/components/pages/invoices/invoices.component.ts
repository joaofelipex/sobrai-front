import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { ClientService } from '../../../services/client.service';
import { Invoice } from '../../../models/invoice.model';
import { Client } from '../../../models/client.model';

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
  clientService = inject(ClientService);
  datePipe = inject(DatePipe);

  isModalOpen = signal(false);
  filter = signal<'all' | 'issued' | 'paid' | 'canceled'>('all');
  isAddingNewClient = signal(false);

  clients = this.clientService.clients;

  invoicesWithClientNames = computed(() => {
    return this.invoiceService.invoices().map(invoice => {
      const client = this.clientService.getClientById(invoice.clientId);
      return {
        ...invoice,
        clientName: client ? client.name : 'Cliente não encontrado'
      };
    });
  });

  filteredInvoices = computed(() => {
    const invoices = this.invoicesWithClientNames();
    const currentFilter = this.filter();
    if (currentFilter === 'all') {
      return invoices;
    }
    return invoices.filter(inv => inv.status === currentFilter);
  });

  newInvoiceForm = signal<Omit<Invoice, 'id' | 'taxAmount' | 'status'>>({
    clientId: '',
    description: '',
    amount: 0,
    issueDate: '',
  });

  newClientForm = signal<Omit<Client, 'id'>>({ name: '', document: '' });

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
    const firstClientId = this.clients().length > 0 ? this.clients()[0].id : '';
    this.newInvoiceForm.set({
      clientId: firstClientId,
      description: 'Prestação de serviços de consultoria',
      amount: 1000,
      issueDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
    });
    this.newClientForm.set({ name: '', document: '' });
    this.isAddingNewClient.set(false);
  }

  saveInvoice() {
    let formValue = this.newInvoiceForm();
    if (this.isAddingNewClient()) {
      const newClient = this.clientService.addClient(this.newClientForm());
      formValue.clientId = newClient.id;
    }

    if (!formValue.clientId || !formValue.description || formValue.amount <= 0 || !formValue.issueDate) {
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

  toggleNewClientForm(show: boolean) {
    this.isAddingNewClient.set(show);
    if (!show) {
       this.newInvoiceForm.update(form => ({...form, clientId: this.clients()[0]?.id || ''}));
    } else {
       this.newInvoiceForm.update(form => ({...form, clientId: ''}));
    }
  }
}
