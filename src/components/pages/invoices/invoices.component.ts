import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { ClientService } from '../../../services/client.service';
import { NfseService } from '../../../services/nfse.service';
import { NfseDocument } from '../../../models/nfse.model';
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
  invoicePendingDelete = signal<string | null>(null);
  nfseService = inject(NfseService);
  nfseToCancel = signal<NfseDocument | null>(null);
  cancelCode = signal<'1' | '2' | '9'>('1');
  cancelText = signal('');
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
    const formValue = this.newInvoiceForm();

    const performSave = (finalInvoiceData: Omit<Invoice, 'id' | 'taxAmount' | 'status'>) => {
        if (!finalInvoiceData.clientId || !finalInvoiceData.description || finalInvoiceData.amount <= 0 || !finalInvoiceData.issueDate) {
            return;
        }
        this.invoiceService.addInvoice(finalInvoiceData);
        this.closeModal();
    };

    if (this.isAddingNewClient()) {
        this.clientService.addClient(this.newClientForm()).subscribe(newClient => {
            const updatedFormValue = { ...formValue, clientId: newClient.id };
            performSave(updatedFormValue);
        });
    } else {
        performSave(formValue);
    }
  }
  
  updateStatus(id: string, status: 'paid' | 'canceled') {
    this.invoiceService.updateInvoiceStatus(id, status);
  }

  openNfseCancel(doc: NfseDocument) {
    this.cancelCode.set('1');
    this.cancelText.set('');
    this.nfseToCancel.set(doc);
  }

  async confirmNfseCancel() {
    const doc = this.nfseToCancel();
    if (!doc) return;
    const ok = await this.nfseService.cancel(doc, this.cancelCode(), this.cancelText().trim());
    if (ok) {
      // O backend também marca a nota fiscal como cancelada; recarrega a lista local.
      this.invoiceService.invoices.update(list => list.map(i => i.id === doc.invoiceId ? { ...i, status: 'canceled' } : i));
      this.nfseToCancel.set(null);
    }
  }

  confirmDeleteInvoice() {
    const id = this.invoicePendingDelete();
    if (id) this.invoiceService.deleteInvoice(id);
    this.invoicePendingDelete.set(null);
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
