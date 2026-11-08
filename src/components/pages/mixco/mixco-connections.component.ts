import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { ToastService } from '../../../services/toast.service';
import { environment } from '../../../environments/environment';

declare global { interface Window { PluggyConnect?: any } }

/** Conexões bancárias via Pluggy (open finance): conecta, sincroniza e remove. */
@Component({
  selector: 'app-mixco-connections',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="mx-page p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
  <div class="mb-6 mx-rise">
    <h1 class="mx-title">Conexões bancárias</h1>
    <p class="mx-subtitle">Contas, cartões, lançamentos e investimentos entram sozinhos pela Pluggy. Só leitura: o MiXCo não movimenta dinheiro.</p>
  </div>

  @if (mixco.pluggy(); as p) {
    @if (!p.configured) {
      <section class="rounded-2xl ring-1 ring-amber-200 bg-amber-50 text-amber-900 p-5 sm:p-6 mb-6 mx-rise">
        <h2 class="font-semibold">Falta configurar as credenciais da Pluggy</h2>
        <ol class="mt-2 text-sm list-decimal pl-5 space-y-1">
          <li>No <b>dashboard.pluggy.ai</b>, abra sua aplicação e copie o <b>Client ID</b> e o <b>Client Secret</b>.</li>
          <li>Na pasta da API (<code>sobrai-back</code>), crie o arquivo <code>.env</code> (copie de <code>.env.example</code>) e preencha <code>PLUGGY_CLIENT_ID</code> e <code>PLUGGY_CLIENT_SECRET</code>.</li>
          <li>Reinicie a API e recarregue esta página.</li>
        </ol>
        <p class="mt-3 text-sm">As chaves ficam só no servidor: nunca vão para o navegador nem para o Git.</p>
      </section>
    } @else {
      <section class="mx-card p-5 sm:p-6 mb-6 mx-rise">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="mx-section-title">Conectar um banco</h2>
            <p class="text-sm text-slate-500">Abre o login seguro da Pluggy. Suas senhas não passam pelo MiXCo.</p>
          </div>
          <button type="button" class="btn-primary" [disabled]="busy()" (click)="connect()">{{ busy() ? 'Abrindo…' : 'Conectar banco' }}</button>
        </div>
        <form class="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3" (ngSubmit)="addManual()">
          <input class="mx-field sm:flex-1" name="itemId" [(ngModel)]="manualItemId" placeholder="Já tem uma conexão na Pluggy? Cole o Item ID (ex: 3f2a…)">
          <button type="submit" class="btn-secondary" [disabled]="!manualItemId.trim() || mixco.syncing()">Adicionar por Item ID</button>
        </form>
      </section>
    }

    <section class="mx-card mx-rise">
      <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
        <h2 class="mx-section-title">Conexões ativas</h2>
        <button type="button" class="btn-secondary" [disabled]="!p.configured || !p.items.length || mixco.syncing()" (click)="mixco.syncPluggy()">
          {{ mixco.syncing() ? 'Sincronizando…' : 'Sincronizar agora' }}
        </button>
      </div>
      @for (i of p.items; track i.itemId) {
        <div class="mx-row flex-wrap gap-y-1">
          <div class="flex-1 min-w-[12rem]">
            <p class="font-medium text-slate-800">{{ i.connector || 'Banco' }}</p>
            <p class="text-xs text-slate-500 break-all">{{ i.itemId }}</p>
            @if (i.lastError) { <p class="text-xs text-[var(--color-loss)] mt-1">Erro: {{ i.lastError }}</p> }
          </div>
          <p class="text-sm text-slate-500">{{ i.lastSyncAt ? 'Sincronizado em ' + fmt(i.lastSyncAt) : 'Nunca sincronizado' }}</p>
          <button type="button" class="btn-link-danger" (click)="mixco.removePluggyItem(i.itemId)">Remover</button>
        </div>
      } @empty {
        <p class="p-6 text-sm text-slate-500 text-center">Nenhum banco conectado ainda.</p>
      }
    </section>
    <p class="mt-4 text-xs text-slate-500">
      Entram só lançamentos efetivados. Pagamento de fatura e transferências entre suas contas ficam fora do fluxo para não contar duas vezes.
      O saldo das contas é o informado pelo banco; as categorias são sugeridas e você pode ajustá-las ou criar regras em Fluxo de caixa.
    </p>
  } @else {
    <p class="text-sm text-slate-500">Carregando…</p>
  }
</main>`,
})
export class MixcoConnectionsComponent implements OnInit {
  mixco = inject(MixcoService);
  private toast = inject(ToastService);
  busy = signal(false);
  manualItemId = '';

  ngOnInit() { void this.mixco.loadAll(); }

  fmt(iso: string): string { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }

  private loadWidget(): Promise<void> {
    if (window.PluggyConnect) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = environment.pluggyConnectScript;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('widget'));
      document.head.appendChild(el);
    });
  }

  async connect() {
    this.busy.set(true);
    try {
      const connectToken = await this.mixco.pluggyConnectToken();
      await this.loadWidget();
      const widget = new window.PluggyConnect({
        connectToken,
        includeSandbox: false,
        onSuccess: (data: { item: { id: string } }) => { void this.mixco.addPluggyItem(data.item.id); },
        onError: () => this.toast.showError('A conexão com o banco não foi concluída.'),
      });
      widget.init();
    } catch (err: any) {
      this.toast.showError(err?.message === 'widget'
        ? 'Não consegui carregar o widget da Pluggy. Use "Adicionar por Item ID" ou confira o endereço em environment.ts.'
        : err?.error?.message || 'Não foi possível iniciar a conexão.');
    } finally {
      this.busy.set(false);
    }
  }

  async addManual() {
    const id = this.manualItemId.trim();
    if (id && await this.mixco.addPluggyItem(id)) this.manualItemId = '';
  }
}
