import { Injectable, signal, effect, inject, computed } from '@angular/core';
import { Invoice } from '../models/invoice.model';
import { OnboardingService } from './onboarding.service';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';
import { ClientService } from './client.service';

/**
 * Serviço para gerenciar as notas fiscais (faturas).
 *
 * Responsável por carregar, salvar, adicionar e atualizar notas fiscais.
 * Persiste os dados no `localStorage` e se integra com outros serviços
 * como `TransactionService` para criar transações de receita correspondentes
 * e `ToastService` para notificar o usuário.
 */
@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private storageKey = 'sobrai_invoices_v1';

  /** Sinal (Signal) que armazena a lista de notas fiscais. */
  invoices = signal<Invoice[]>([]);

  // Injeção de dependências de outros serviços.
  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  toastService = inject(ToastService);
  clientService = inject(ClientService);

  /**
   * `computed` que calcula o valor total de impostos das notas fiscais emitidas (não canceladas).
   * Este valor é recalculado automaticamente sempre que a lista de `invoices` muda.
   */
  totalTaxesIssued = computed(() =>
    this.invoices()
      .filter(inv => inv.status !== 'canceled')
      .reduce((sum, inv) => sum + inv.taxAmount, 0)
  );

  /**
   * Construtor do serviço.
   * Carrega as notas fiscais do `localStorage` e configura um `effect`
   * para salvar as notas automaticamente sempre que o `signal` `invoices` for modificado.
   */
  constructor() {
    this.loadInvoicesFromStorage();
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.invoices()));
    });
  }

  /**
   * Carrega as notas fiscais armazenadas no `localStorage`.
   * @private
   */
  private loadInvoicesFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.invoices.set(JSON.parse(data));
    }
  }

  /**
   * Ordena uma lista de notas fiscais pela data de emissão, da mais recente para a mais antiga.
   * @param invoices O array de notas fiscais a ser ordenado.
   * @returns O array de notas fiscais ordenado.
   * @private
   */
  private sortInvoices(invoices: Invoice[]): Invoice[] {
    return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  /**
   * Busca uma nota fiscal pelo seu ID.
   * @param id O ID da nota fiscal a ser buscada.
   * @returns A nota fiscal encontrada ou `undefined`.
   */
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  /**
   * Adiciona uma nova nota fiscal.
   * - Calcula o imposto com base no perfil da empresa.
   * - Cria a nota fiscal com um ID único e status 'issued'.
   * - Adiciona a nota à lista e a ordena.
   * - Cria uma transação de receita correspondente usando o `TransactionService`.
   * - Exibe uma notificação de sucesso.
   * @param invoiceData Os dados da nota fiscal, sem os campos `id`, `taxAmount` e `status`.
   */
  addInvoice(invoiceData: Omit<Invoice, 'id' | 'taxAmount' | 'status'>) {
    const profile = this.onboardingService.companyProfile();
    // Define a taxa de imposto com base no tipo de empresa
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

    // Integração: Cria uma transação de receita correspondente
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

  /**
   * Atualiza o status de uma nota fiscal para 'paga' ou 'cancelada'.
   * @param id O ID da nota fiscal a ser atualizada.
   * @param status O novo status da nota fiscal.
   */
  updateInvoiceStatus(id: string, status: 'paid' | 'canceled') {
     this.invoices.update(invoices =>
      invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    );
    this.toastService.show(`Nota Fiscal marcada como ${status === 'paid' ? 'Paga' : 'Cancelada'}.`, 'info');
  }
}
