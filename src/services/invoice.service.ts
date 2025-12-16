import { Injectable, signal, effect, inject, computed } from '@angular/core';
import { Invoice } from '../models/invoice.model';
import { OnboardingService } from './onboarding.service';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';
import { ClientService } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private storageKey = 'sobrai_invoices_v1';
  invoices = signal<Invoice[]>([]);

  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  toastService = inject(ToastService);
  clientService = inject(ClientService);
  
  totalTaxesIssued = computed(() => 
    this.invoices()
      .filter(inv => inv.status !== 'canceled')
      .reduce((sum, inv) => sum + inv.taxAmount, 0)
  );

  constructor() {
    this.loadInvoicesFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.invoices()));
    });
  }

  private loadInvoicesFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.invoices.set(JSON.parse(data));
    }
  }

  private sortInvoices(invoices: Invoice[]): Invoice[] {
    return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  addInvoice(invoiceData: Omit<Invoice, 'id' | 'taxAmount' | 'status'>) {
    const profile = this.onboardingService.companyProfile();
    const taxRate = profile ? { mei: 0.05, simples: 0.06, autonomo: 0.115 }[profile.type] : 0.08;
    const taxAmount = invoiceData.amount * taxRate;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: self.crypto.randomUUID(),
      taxAmount,
      status: 'issued',
    };

    this.invoices.update(invoices => this.sortInvoices([...invoices, newInvoice]));
    
    const client = this.clientService.getClientById(newInvoice.clientId);
    const clientName = client ? client.name : 'Cliente desconhecido';

    // Integration: Create a corresponding revenue transaction
    this.transactionService.addTransaction({
      type: 'revenue',
      description: `Nota Fiscal: ${clientName}`,
      amount: newInvoice.amount,
      date: newInvoice.issueDate,
      category: 'Prestação de Serviço',
      invoiceId: newInvoice.id,
    });
    
    this.toastService.show('Nota Fiscal emitida com sucesso!');
  }
  
  updateInvoiceStatus(id: string, status: 'paid' | 'canceled') {
     this.invoices.update(invoices => 
      invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    );
    this.toastService.show(`Nota Fiscal marcada como ${status === 'paid' ? 'Paga' : 'Cancelada'}.`, 'info');
  }
}
