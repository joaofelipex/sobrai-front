import { Component, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MixcoService } from '../../../services/mixco.service';
import { ASSET_CLASS_LABELS, MxInsight } from '../../../models/mixco.model';
import { LineChartComponent } from '../../shared/chart/line-chart.component';
import { BrlPipe } from './brl.pipe';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const STALE_MS = 6 * 60 * 60 * 1000;

/** Visão geral: o que fazer agora, patrimônio, tendência, alocação e orçamento do mês. */
@Component({
  selector: 'app-mixco-overview',
  standalone: true,
  imports: [RouterModule, LineChartComponent, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Visão geral</h1>
      <p class="text-sm text-slate-500 mt-0.5">{{ monthLabel() }} · seu dinheiro, sem achismo.</p>
    </div>
    @if (mixco.pluggy(); as p) {
      @if (p.configured && p.items.length) {
        <div class="flex items-center gap-3 text-sm text-slate-500">
          <span>{{ p.lastSyncAt ? 'Atualizado ' + relative(p.lastSyncAt) : 'Nunca sincronizado' }}</span>
          <button type="button" class="btn-secondary" [disabled]="mixco.syncing()" (click)="mixco.syncPluggy()">{{ mixco.syncing() ? 'Sincronizando…' : 'Sincronizar bancos' }}</button>
        </div>
      }
    }
  </div>

  @if (s(); as s) {
    @if (isEmpty()) {
      <div class="text-center py-14 px-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
        <h3 class="text-xl font-semibold text-slate-800">Vamos organizar de verdade</h3>
        <p class="mt-2 text-slate-500 max-w-lg mx-auto">O caminho mais rápido é conectar seus bancos pela Pluggy: contas, cartão, lançamentos e investimentos entram sozinhos. Se preferir, cadastre tudo à mão.</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/mixco/conexoes" class="btn-primary">Conectar meus bancos</a>
          <a routerLink="/mixco/fluxo" class="btn-secondary">Cadastrar à mão</a>
        </div>
      </div>
    } @else {
      <!-- O que fazer agora -->
      @if (s.insights.length) {
        <section class="mb-6">
          <h2 class="font-semibold text-slate-800 mb-2">O que fazer agora</h2>
          <ul class="space-y-2">
            @for (i of s.insights; track i.title) {
              <li class="rounded-lg border px-4 py-3 flex items-start gap-3" [class]="tone(i)">
                <span class="mt-0.5 text-sm font-bold w-5 text-center">{{ icon(i) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ i.title }}</p>
                  <p class="text-sm opacity-80">{{ i.text }}</p>
                </div>
                @if (i.link) { <a [routerLink]="i.link" class="text-sm font-medium underline whitespace-nowrap">Abrir</a> }
              </li>
            }
          </ul>
        </section>
      }

      <!-- Patrimônio líquido -->
      <section class="bg-slate-900 text-white rounded-lg p-6 mb-6">
        <p class="text-sm text-slate-400">Patrimônio líquido</p>
        <p class="text-3xl sm:text-4xl font-semibold tabular mt-1" [class.text-red-300]="s.netWorth < 0">{{ s.netWorth | brl }}</p>
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl text-sm">
          <div><p class="text-slate-400">Ativos</p><p class="font-medium tabular">{{ s.assets | brl }}</p></div>
          <div><p class="text-slate-400">Dívidas</p><p class="font-medium tabular">{{ s.liabilities | brl }}</p></div>
          @if (s.cardDebt > 0) { <div><p class="text-slate-400">Cartão em aberto</p><p class="font-medium tabular">{{ s.cardDebt | brl }}</p></div> }
        </div>
      </section>

      <!-- Indicadores -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Taxa de poupança</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.flow.savingsRate === null ? '—' : s.flow.savingsRate + '%' }}</p>
          <p class="text-xs text-slate-500 mt-1">Sobrou {{ s.flow.saved | brl }} de {{ s.flow.income | brl }}</p>
        </div>
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Reserva de emergência</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.emergencyFund.months === null ? '—' : s.emergencyFund.months + ' meses' }}</p>
          <p class="text-xs mt-1" [class.text-red-700]="reserveLow()" [class.text-slate-500]="!reserveLow()">{{ reserveHint() }}</p>
        </div>
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Gasto do mês</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.flow.expense | brl }}</p>
          <p class="text-xs mt-1" [class.text-red-700]="s.flow.previousExpense > 0 && s.flow.expense > s.flow.previousExpense" [class.text-success-700]="s.flow.previousExpense > 0 && s.flow.expense <= s.flow.previousExpense" [class.text-slate-500]="s.flow.previousExpense === 0">
            {{ expenseDelta() }}
          </p>
        </div>
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Rentabilidade dos investimentos</p>
          <p class="text-xl font-semibold tabular mt-1" [class.text-success-700]="s.investments.profit > 0" [class.text-red-700]="s.investments.profit < 0">
            {{ s.investments.returnPercent === null ? '—' : s.investments.returnPercent + '%' }}
          </p>
          <p class="text-xs text-slate-500 mt-1">{{ s.investments.profit | brl }} sobre {{ s.investments.invested | brl }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section class="bg-white border border-slate-200/80 rounded-lg p-5">
          <h2 class="font-semibold text-slate-800 mb-3">Receitas e despesas (6 meses)</h2>
          <app-line-chart [data]="trendData()"></app-line-chart>
        </section>

        <section class="bg-white border border-slate-200/80 rounded-lg p-5">
          <h2 class="font-semibold text-slate-800 mb-3">Evolução do patrimônio</h2>
          @if (s.history.length >= 2) {
            <app-line-chart [data]="chartData()" [chartColors]="chartColors"></app-line-chart>
          } @else {
            <p class="text-sm text-slate-500 py-8 text-center">O MiXCo guarda uma foto do patrimônio por mês. A curva aparece a partir do segundo mês de uso.</p>
          }
        </section>

        <section class="bg-white border border-slate-200/80 rounded-lg p-5">
          <h2 class="font-semibold text-slate-800 mb-3">Onde está o seu dinheiro</h2>
          @for (a of s.allocation; track a.assetClass) {
            <div class="mb-3">
              <div class="flex justify-between text-sm"><span class="text-slate-700">{{ label(a.assetClass) }}</span><span class="tabular text-slate-500">{{ a.value | brl }} · {{ a.percent }}%</span></div>
              <div class="mt-1 h-2 rounded-full bg-slate-100"><div class="h-2 rounded-full bg-emerald-600" [style.width.%]="a.percent"></div></div>
            </div>
          } @empty {
            <p class="text-sm text-slate-500">Nenhum ativo cadastrado.</p>
          }
        </section>

        <section class="bg-white border border-slate-200/80 rounded-lg p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-slate-800">Orçamento do mês</h2>
            <a routerLink="/mixco/fluxo" class="text-sm text-emerald-700 hover:underline">Ajustar</a>
          </div>
          @for (b of s.budget; track b.category) {
            <div class="mb-3">
              <div class="flex justify-between text-sm gap-3">
                <span class="text-slate-700">{{ b.category }}</span>
                <span class="tabular text-right" [class.text-red-700]="b.over" [class.text-slate-500]="!b.over">
                  {{ b.spent | brl }}{{ b.limit ? ' de ' + (b.limit | brl) : '' }}
                  @if (b.previous > 0) { <span class="text-xs text-slate-400"> · mês ant. {{ b.previous | brl }}</span> }
                </span>
              </div>
              @if (b.limit) {
                <div class="mt-1 h-2 rounded-full bg-slate-100">
                  <div class="h-2 rounded-full" [class.bg-red-600]="b.over" [class.bg-emerald-600]="!b.over" [style.width.%]="Math.min(b.percent ?? 0, 100)"></div>
                </div>
              }
            </div>
          } @empty {
            <p class="text-sm text-slate-500">Sem despesas neste mês.</p>
          }
        </section>
      </div>
    }
  } @else {
    <p class="text-sm text-slate-500">Carregando…</p>
  }
</main>`,
})
export class MixcoOverviewComponent implements OnInit {
  mixco = inject(MixcoService);
  readonly Math = Math;
  readonly chartColors = { 'Patrimônio': '#2c5a86' };
  s = this.mixco.summary;

  isEmpty = computed(() => {
    const s = this.s();
    return !s || (s.assets === 0 && s.liabilities === 0 && s.flow.income === 0 && s.flow.expense === 0);
  });

  monthLabel = computed(() => {
    const [y, m] = this.mixco.month().split('-').map(Number);
    return `${MONTHS[m - 1]}/${y}`;
  });

  trendData = computed(() => (this.s()?.trend ?? []).map(t => ({
    name: `${MONTHS[Number(t.month.slice(5)) - 1]}/${t.month.slice(2, 4)}`, Receita: t.income, Despesa: t.expense,
  })));
  chartData = computed(() => (this.s()?.history ?? []).map(h => ({
    name: `${MONTHS[Number(h.month.slice(5)) - 1]}/${h.month.slice(2, 4)}`, 'Patrimônio': h.netWorth,
  })));

  reserveLow = computed(() => {
    const m = this.s()?.emergencyFund.months;
    return m !== null && m !== undefined && m < 6;
  });
  reserveHint = computed(() => {
    const e = this.s()?.emergencyFund;
    if (!e || e.months === null) return 'Sem despesas nos 3 meses anteriores para calcular';
    return e.months < 6 ? 'Meta usual: 6 meses de despesas' : 'Dentro da meta de 6 meses';
  });
  expenseDelta = computed(() => {
    const f = this.s()?.flow;
    if (!f || !f.previousExpense) return 'Sem mês anterior para comparar';
    const pct = Math.round(((f.expense - f.previousExpense) / f.previousExpense) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% vs. mês anterior`;
  });

  label(c: string): string { return ASSET_CLASS_LABELS[c] ?? c; }

  tone(i: MxInsight): string {
    return {
      alert: 'bg-red-50 border-red-200 text-red-900',
      warn: 'bg-amber-50 border-amber-200 text-amber-900',
      info: 'bg-slate-50 border-slate-200 text-slate-800',
      ok: 'bg-green-50 border-green-200 text-green-900',
    }[i.level];
  }
  icon(i: MxInsight): string { return { alert: '!', warn: '▲', info: 'i', ok: '✓' }[i.level]; }

  relative(iso: string): string {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'agora há pouco';
    if (min < 60) return `há ${min} min`;
    if (min < 1440) return `há ${Math.round(min / 60)} h`;
    return `há ${Math.round(min / 1440)} dia(s)`;
  }

  async ngOnInit() {
    await this.mixco.loadAll();
    // Mantém os dados frescos sem o usuário precisar lembrar: sincroniza se passou de 6 h.
    const p = this.mixco.pluggy();
    const last = p?.lastSyncAt ? new Date(p.lastSyncAt).getTime() : 0;
    if (p?.configured && p.items.length && Date.now() - last > STALE_MS) void this.mixco.syncPluggy(true);
  }
}
