import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ToastService } from './toast.service';
import { MxAccount, MxAsset, MxBudget, MxLiability, MxSummary, MxTransaction } from '../models/mixco.model';

/** Mês corrente no formato AAAA-MM. */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Estado do MiXCo (patrimônio pessoal). Cada escrita chama a API e depois recarrega o resumo,
 * já que quase tudo (patrimônio, orçamento, reserva) deriva dos mesmos dados.
 */
@Injectable({ providedIn: 'root' })
export class MixcoService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private api = `${environment.backendUrl}/api/mixco`;

  summary = signal<MxSummary | null>(null);
  accounts = signal<MxAccount[]>([]);
  transactions = signal<MxTransaction[]>([]);
  assets = signal<MxAsset[]>([]);
  liabilities = signal<MxLiability[]>([]);
  budgets = signal<MxBudget[]>([]);
  month = signal(currentMonth());
  loading = signal(false);

  /** Carrega tudo de uma vez (telas do MiXCo chamam ao abrir). */
  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const m = this.month();
      const [summary, accounts, transactions, assets, liabilities, budgets] = await Promise.all([
        firstValueFrom(this.http.get<MxSummary>(`${this.api}/summary?month=${m}`)),
        firstValueFrom(this.http.get<MxAccount[]>(`${this.api}/accounts`)),
        firstValueFrom(this.http.get<MxTransaction[]>(`${this.api}/transactions?month=${m}`)),
        firstValueFrom(this.http.get<MxAsset[]>(`${this.api}/assets`)),
        firstValueFrom(this.http.get<MxLiability[]>(`${this.api}/liabilities`)),
        firstValueFrom(this.http.get<MxBudget[]>(`${this.api}/budgets`)),
      ]);
      this.summary.set(summary);
      this.accounts.set(accounts);
      this.transactions.set(transactions);
      this.assets.set(assets);
      this.liabilities.set(liabilities);
      this.budgets.set(budgets);
    } catch (err) {
      console.error('MiXCo: falha ao carregar', err);
      this.toast.showError('Não foi possível carregar o MiXCo. A API está rodando?');
    } finally {
      this.loading.set(false);
    }
  }

  async setMonth(month: string): Promise<void> {
    this.month.set(month);
    await this.loadAll();
  }

  /** Cria (sem id) ou atualiza (com id) um registro e recarrega. Retorna false se falhar. */
  async save(resource: 'accounts' | 'transactions' | 'assets' | 'liabilities', body: { id?: string } & Record<string, unknown>, okMsg: string): Promise<boolean> {
    const { id, ...data } = body;
    return this.run(() => id
      ? firstValueFrom(this.http.put(`${this.api}/${resource}/${id}`, data))
      : firstValueFrom(this.http.post(`${this.api}/${resource}`, data)), okMsg);
  }

  remove(resource: 'accounts' | 'transactions' | 'assets' | 'liabilities', id: string, okMsg: string): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.delete(`${this.api}/${resource}/${id}`)), okMsg);
  }

  setBudget(category: string, monthlyLimit: number): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.put(`${this.api}/budgets/${encodeURIComponent(category)}`, { monthlyLimit })), 'Orçamento salvo.');
  }

  removeBudget(category: string): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.delete(`${this.api}/budgets/${encodeURIComponent(category)}`)), 'Orçamento removido.');
  }

  private async run(op: () => Promise<unknown>, okMsg: string): Promise<boolean> {
    try {
      await op();
      await this.loadAll();
      this.toast.show(okMsg);
      return true;
    } catch (err: any) {
      this.toast.showError(err?.error?.message || 'Não foi possível concluir a operação.');
      return false;
    }
  }
}
