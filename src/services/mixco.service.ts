import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ToastService } from './toast.service';
import { MxAccount, MxAsset, MxBudget, MxGoal, MxLiability, MxRule, MxSummary, MxTransaction, PluggyStatus } from '../models/mixco.model';

type Resource = 'accounts' | 'transactions' | 'assets' | 'liabilities' | 'goals' | 'rules';

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
  goals = signal<MxGoal[]>([]);
  rules = signal<MxRule[]>([]);
  pluggy = signal<PluggyStatus | null>(null);
  syncing = signal(false);
  month = signal(currentMonth());
  loading = signal(false);

  /** Carrega tudo de uma vez (telas do MiXCo chamam ao abrir). */
  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const m = this.month();
      const [summary, accounts, transactions, assets, liabilities, budgets, goals, rules, pluggy] = await Promise.all([
        firstValueFrom(this.http.get<MxSummary>(`${this.api}/summary?month=${m}`)),
        firstValueFrom(this.http.get<MxAccount[]>(`${this.api}/accounts`)),
        firstValueFrom(this.http.get<MxTransaction[]>(`${this.api}/transactions?month=${m}`)),
        firstValueFrom(this.http.get<MxAsset[]>(`${this.api}/assets`)),
        firstValueFrom(this.http.get<MxLiability[]>(`${this.api}/liabilities`)),
        firstValueFrom(this.http.get<MxBudget[]>(`${this.api}/budgets`)),
        firstValueFrom(this.http.get<MxGoal[]>(`${this.api}/goals`)),
        firstValueFrom(this.http.get<MxRule[]>(`${this.api}/rules`)),
        firstValueFrom(this.http.get<PluggyStatus>(`${this.api}/pluggy/status`)),
      ]);
      this.summary.set(summary);
      this.accounts.set(accounts);
      this.transactions.set(transactions);
      this.assets.set(assets);
      this.liabilities.set(liabilities);
      this.budgets.set(budgets);
      this.goals.set(goals);
      this.rules.set(rules);
      this.pluggy.set(pluggy);
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
  async save(resource: Resource, body: { id?: string } & Record<string, unknown>, okMsg: string): Promise<boolean> {
    const { id, ...data } = body;
    return this.run(() => id
      ? firstValueFrom(this.http.put(`${this.api}/${resource}/${id}`, data))
      : firstValueFrom(this.http.post(`${this.api}/${resource}`, data)), okMsg);
  }

  remove(resource: Resource, id: string, okMsg: string): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.delete(`${this.api}/${resource}/${id}`)), okMsg);
  }

  setBudget(category: string, monthlyLimit: number): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.put(`${this.api}/budgets/${encodeURIComponent(category)}`, { monthlyLimit })), 'Orçamento salvo.');
  }

  removeBudget(category: string): Promise<boolean> {
    return this.run(() => firstValueFrom(this.http.delete(`${this.api}/budgets/${encodeURIComponent(category)}`)), 'Orçamento removido.');
  }

  /** Reclassifica lançamentos em "Outros" com as regras atuais. */
  async applyRules(): Promise<void> {
    try {
      const r = await firstValueFrom(this.http.post<{ changed: number }>(`${this.api}/rules/apply`, {}));
      await this.loadAll();
      this.toast.show(r.changed ? `${r.changed} lançamento(s) categorizado(s).` : 'Nenhum lançamento novo para categorizar.', 'info');
    } catch { this.toast.showError('Não foi possível aplicar as regras.'); }
  }

  // ---- Pluggy (open finance) ----

  /** Sincroniza todas as conexões. `silent` evita toasts (sincronização automática ao abrir). */
  async syncPluggy(silent = false): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    try {
      const r = await firstValueFrom(this.http.post<{ items: { error?: string; transactions?: number }[] }>(`${this.api}/pluggy/sync`, {}));
      await this.loadAll();
      const failed = r.items.filter(i => i.error).length;
      const added = r.items.reduce((s, i) => s + (i.transactions || 0), 0);
      if (failed) this.toast.showError(`${failed} conexão(ões) com erro. Veja em Conexões.`);
      else if (!silent) this.toast.show(added ? `${added} novo(s) lançamento(s) importado(s).` : 'Tudo em dia, nada novo para importar.');
    } catch (err: any) {
      if (!silent) this.toast.showError(err?.error?.message || 'Não foi possível sincronizar com a Pluggy.');
    } finally {
      this.syncing.set(false);
    }
  }

  async pluggyConnectToken(): Promise<string> {
    return (await firstValueFrom(this.http.post<{ accessToken: string }>(`${this.api}/pluggy/connect-token`, {}))).accessToken;
  }

  /** Registra uma conexão (itemId) e importa os dados. */
  async addPluggyItem(itemId: string): Promise<boolean> {
    this.syncing.set(true);
    try {
      const r = await firstValueFrom(this.http.post<{ error: string | null; stats: { transactions: number } | null }>(`${this.api}/pluggy/items`, { itemId }));
      await this.loadAll();
      if (r.error) this.toast.showError(`Conectado, mas a importação falhou: ${r.error}`);
      else this.toast.show(`Conectado. ${r.stats?.transactions ?? 0} lançamento(s) importado(s).`);
      return true;
    } catch (err: any) {
      this.toast.showError(err?.error?.message || 'Não foi possível registrar a conexão.');
      return false;
    } finally {
      this.syncing.set(false);
    }
  }

  async removePluggyItem(itemId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.api}/pluggy/items/${encodeURIComponent(itemId)}`));
      await this.loadAll();
      this.toast.show('Conexão removida. Os dados já importados continuam aqui.', 'info');
    } catch { this.toast.showError('Não foi possível remover a conexão.'); }
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
