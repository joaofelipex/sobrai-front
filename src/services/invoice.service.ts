import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { OnboardingService } from './onboarding.service';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';
import { ClientService } from './client.service';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar as notas fiscais (faturas).
 *
 * Responsável por carregar, adicionar, atualizar e excluir notas fiscais na API backend.
 * Se integra com o `TransactionService` para criar a transação de receita correspondente
 * e com o `ToastService` para notificar o usuário.
 */
@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  /** Chave antiga do localStorage, usada apenas para migrar dados para o backend. */
  private legacyStorageKey = 'sobrai_invoices_v1';
  private apiUrl = `${environment.backendUrl}/api/invoices`;

  /** Sinal (Signal) que armazena a lista de notas fiscais. */
  invoices = signal<Invoice[]>([]);

  // Injeção de dependências de outros serviços.
  private http = inject(HttpClient);
  onboardingService = inject(OnboardingService);
  transactionService = inject(TransactionService);
  toastService = inject(ToastService);
  clientService = inject(ClientService);

  /**
   * `computed` que calcula o valor total de impostos das notas fiscais emitidas (não canceladas).
   */
  totalTaxesIssued = computed(() =>
    this.invoices()
      .filter(inv => inv.status !== 'canceled')
      .reduce((sum, inv) => sum + inv.taxAmount, 0)
  );

  constructor() {
    void this.load();
  }

  /** Carrega do servidor e migra, uma única vez, dados antigos do `localStorage`. */
  private async load(): Promise<void> {
    try {
      let items = await firstValueFrom(this.http.get<Invoice[]>(this.apiUrl));
      const legacy = this.readLegacy();
      if (legacy.length > 0) {
        await this.migrateLegacy(legacy);
        items = await firstValueFrom(this.http.get<Invoice[]>(this.apiUrl));
      }
      this.invoices.set(items);
    } catch (err) {
      console.error('Falha ao carregar notas fiscais do servidor', err);
    }
  }

  private readLegacy(): Invoice[] {
    try {
      const data = localStorage.getItem(this.legacyStorageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /** Envia as notas do localStorage para o backend (que gera novos IDs). */
  private async migrateLegacy(legacy: Invoice[]) {
    const clients = await firstValueFrom(this.http.get<{ id: string }[]>(`${environment.backendUrl}/api/clients`));
    const knownClients = new Set(clients.map(c => c.id));
    for (const { id: _id, ...inv } of legacy) {
      if (!knownClients.has(inv.clientId)) continue; // cliente inexistente: o backend recusaria
      await firstValueFrom(this.http.post<Invoice>(this.apiUrl, inv));
    }
    localStorage.removeItem(this.legacyStorageKey);
  }

  /**
   * Busca uma nota fiscal pelo seu ID.
   * @param id O ID da nota fiscal a ser buscada.
   */
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  /**
   * Adiciona uma nova nota fiscal.
   * - Calcula o imposto com base no perfil da empresa.
   * - Salva a nota no backend e, em caso de sucesso, cria a transação de receita correspondente.
   * @param invoiceData Os dados da nota fiscal, sem os campos `id`, `taxAmount` e `status`.
   */
  addInvoice(invoiceData: Omit<Invoice, 'id' | 'taxAmount' | 'status'>) {
    const profile = this.onboardingService.companyProfile();
    const taxRate = profile ? { mei: 0.05, simples: 0.06, autonomo: 0.115 }[profile.type] : 0.08;
    const taxAmount = invoiceData.amount * taxRate;

    this.http.post<Invoice>(this.apiUrl, { ...invoiceData, taxAmount, status: 'issued' }).subscribe({
      next: (newInvoice) => {
        this.invoices.update(invoices => this.sortInvoices([...invoices, newInvoice]));

        const client = this.clientService.getClientById(newInvoice.clientId);
        this.transactionService.addTransaction({
          type: 'revenue',
          description: `Nota Fiscal: ${client ? client.name : 'Cliente desconhecido'}`,
          amount: newInvoice.amount,
          date: newInvoice.issueDate,
          category: 'Prestação de Serviço',
          invoiceId: newInvoice.id,
        });

        this.toastService.show('Nota Fiscal emitida com sucesso!');
      },
      error: (err) => this.fail('emitir a nota fiscal', err)
    });
  }

  /**
   * Atualiza o status de uma nota fiscal para 'paga' ou 'cancelada'.
   */
  updateInvoiceStatus(id: string, status: 'paid' | 'canceled') {
    this.http.patch<Invoice>(`${this.apiUrl}/${id}`, { status }).subscribe({
      next: (saved) => {
        this.invoices.update(invoices => invoices.map(inv => inv.id === id ? saved : inv));
        this.toastService.show(`Nota Fiscal marcada como ${status === 'paid' ? 'Paga' : 'Cancelada'}.`, 'info');
      },
      error: (err) => this.fail('atualizar a nota fiscal', err)
    });
  }

  /**
   * Exclui uma nota fiscal. O backend também remove a receita gerada por ela,
   * então a lista local de transações é atualizada para refletir isso.
   */
  deleteInvoice(id: string) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.invoices.update(invoices => invoices.filter(inv => inv.id !== id));
        this.transactionService.transactions.update(ts => ts.filter(t => t.invoiceId !== id));
        this.toastService.show('Nota Fiscal excluída.', 'info');
      },
      error: (err) => this.fail('excluir a nota fiscal', err)
    });
  }

  private sortInvoices(invoices: Invoice[]): Invoice[] {
    return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  private fail(action: string, err: unknown) {
    console.error(`Falha ao ${action}`, err);
    // O backend explica o motivo nos conflitos (ex: nota com NFS-e autorizada).
    const reason = err instanceof HttpErrorResponse && err.status === 409 ? err.error?.message : null;
    this.toastService.showError(reason || `Não foi possível ${action}.`);
  }
}
