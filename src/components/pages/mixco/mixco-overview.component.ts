import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, PiggyBank, ShieldCheck, Receipt, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight, ArrowRight, Landmark, Check, CircleAlert, TriangleAlert, Info, CircleCheck } from 'lucide-angular';
import { MixcoService } from '../../../services/mixco.service';
import { ASSET_CLASS_LABELS, MxInsight } from '../../../models/mixco.model';
import { LineChartComponent } from '../../shared/chart/line-chart.component';
import { BrlPipe } from './brl.pipe';
import { DonutComponent, SparklineComponent, colorOfCategory, colorOfClass } from './mx-visuals';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const STALE_MS = 6 * 60 * 60 * 1000;

/** Visão geral: o que fazer agora, patrimônio, tendência, alocação e orçamento do mês. */
@Component({
  selector: 'app-mixco-overview',
  standalone: true,
  imports: [NgFor, RouterModule, LucideAngularModule, LineChartComponent, BrlPipe, DonutComponent, SparklineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="mx-page p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
  <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 mx-rise">
    <div>
      <p class="mx-label">{{ monthLabel() }}</p>
      <h1 class="mx-title mt-1">{{ greeting() }}</h1>
      <p class="mx-subtitle">Seu dinheiro, sem achismo.</p>
    </div>
    @if (mixco.pluggy(); as p) {
      @if (p.configured && p.items.length) {
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)]"></span>{{ p.lastSyncAt ? 'Atualizado ' + relative(p.lastSyncAt) : 'Nunca sincronizado' }}</span>
          <button type="button" class="btn-secondary !py-1.5" [disabled]="mixco.syncing()" (click)="mixco.syncPluggy()">
            <lucide-icon [img]="icons.refresh" [size]="15" [class.animate-spin]="mixco.syncing()"></lucide-icon>
            {{ mixco.syncing() ? 'Sincronizando' : 'Sincronizar' }}
          </button>
        </div>
      }
    }
  </div>

  @if (s(); as s) {
    @if (isEmpty()) {
      <div class="mx-card text-center py-16 px-6 mx-rise">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-mint-400 to-emerald-600 text-white flex items-center justify-center shadow-lg">
          <lucide-icon [img]="icons.landmark" [size]="26"></lucide-icon>
        </div>
        <h3 class="mt-5 text-xl font-semibold tracking-tight text-slate-900">Vamos organizar de verdade</h3>
        <p class="mt-2 text-slate-500 max-w-lg mx-auto">O caminho mais rápido é conectar seus bancos pela Pluggy: contas, cartão, lançamentos e investimentos entram sozinhos. Se preferir, cadastre tudo à mão.</p>
        <div class="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/mixco/conexoes" class="btn-primary">Conectar meus bancos</a>
          <a routerLink="/mixco/fluxo" class="btn-secondary">Cadastrar à mão</a>
        </div>
      </div>
    } @else {
      <!-- Hero: patrimônio líquido -->
      <section class="mx-hero mb-6 mx-rise" style="animation-delay: 60ms">
        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-end">
          <div>
            <p class="text-sm text-white/60 font-medium">Patrimônio líquido</p>
            <p class="text-4xl sm:text-5xl font-semibold tracking-tight tabular mt-2" [class.text-rose-300]="s.netWorth < 0">{{ s.netWorth | brl }}</p>
            @if (netDelta(); as d) {
              <p class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                 [class]="d.value >= 0 ? 'bg-mint-400/15 text-mint-300' : 'bg-rose-400/15 text-rose-300'">
                <lucide-icon [img]="d.value >= 0 ? icons.up : icons.down" [size]="14"></lucide-icon>
                {{ d.value >= 0 ? '+' : '' }}{{ d.value | brl }} vs. mês anterior
              </p>
            }
          </div>
          <div class="h-20 opacity-95"><mx-sparkline [values]="sparkValues()"></mx-sparkline></div>
        </div>
        <div class="relative z-10 mt-7 pt-5 border-t border-white/10 grid grid-cols-3 gap-4 text-sm">
          <div><p class="text-white/50 text-xs">Ativos</p><p class="font-semibold tabular mt-0.5">{{ s.assets | brl }}</p></div>
          <div><p class="text-white/50 text-xs">Dívidas</p><p class="font-semibold tabular mt-0.5">{{ s.liabilities | brl }}</p></div>
          <div><p class="text-white/50 text-xs">Liquidez</p><p class="font-semibold tabular mt-0.5">{{ s.emergencyFund.liquid | brl }}</p></div>
        </div>
      </section>

      <!-- Indicadores -->
      <div class="mx-scroll-x flex snap-x snap-mandatory scroll-px-4 gap-3 -mx-4 px-4 pb-2 mb-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-4 sm:mb-6 sm:overflow-visible">
        @for (k of kpis(); track k.label; let i = $index) {
          <div class="mx-card mx-card-hover p-4 sm:p-5 mx-rise snap-start shrink-0 w-[62%] sm:w-auto" [style.animation-delay.ms]="120 + i * 50">
            <div class="flex items-center justify-between">
              <span class="mx-label">{{ k.label }}</span>
              <span class="w-8 h-8 rounded-xl flex items-center justify-center" [style.background]="k.tint" [style.color]="k.color">
                <lucide-icon [img]="k.icon" [size]="16"></lucide-icon>
              </span>
            </div>
            <p class="mt-3 text-[26px] leading-none font-semibold tracking-tight tabular" [style.color]="k.valueColor">{{ k.value }}</p>
            <p class="mt-2 text-xs text-slate-500 leading-snug">{{ k.hint }}</p>
          </div>
        }
      </div>

      <!-- O que fazer agora -->
      @if (s.insights.length) {
        <section class="mb-6 mx-rise" style="animation-delay: 200ms">
          <h2 class="mx-section-title mb-3">O que fazer agora</h2>
          <ul class="grid grid-cols-1 xl:grid-cols-2 gap-3">
            @for (i of shownInsights(); track i.title) {
              <li class="relative overflow-hidden mx-card p-4 pl-5 flex items-start gap-3">
                <span class="absolute left-0 inset-y-0 w-1" [style.background]="tone(i).bar"></span>
                <span class="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center" [style.background]="tone(i).tint" [style.color]="tone(i).bar">
                  <lucide-icon [img]="tone(i).icon" [size]="17"></lucide-icon>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900">{{ i.title }}</p>
                  <p class="text-[13px] text-slate-500 mt-0.5 leading-snug">{{ i.text }}</p>
                </div>
                @if (i.link) { <a [routerLink]="i.link" class="btn-link shrink-0 inline-flex items-center gap-1">Abrir <lucide-icon [img]="icons.go" [size]="13"></lucide-icon></a> }
              </li>
            }
          </ul>
          @if (s.insights.length > 3) {
            <button type="button" class="btn-link mt-1" (click)="showAllInsights.set(!showAllInsights())">
              {{ showAllInsights() ? 'Mostrar menos' : 'Ver todos (' + s.insights.length + ')' }}
            </button>
          }
        </section>
      }

      <!-- Contas fixas e projeção do mês -->
      @if (s.upcoming.length) {
        <section class="mx-card p-5 sm:p-6 mb-4 sm:mb-6 mx-rise" style="animation-delay: 230ms">
          <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 class="mx-section-title">Contas fixas do mês</h2>
              <p class="text-xs text-slate-500 mt-0.5">Pendentes: {{ s.projection.pendingOut | brl }} a pagar{{ s.projection.pendingIn ? ' · ' + (s.projection.pendingIn | brl) + ' a receber' : '' }}</p>
            </div>
            <div class="text-right">
              <p class="mx-label">Projeção até o fim do mês</p>
              <p class="text-xl font-semibold tabular tracking-tight" [class.text-[var(--color-loss)]]="s.projection.projectedBalance < 0">{{ s.projection.projectedBalance | brl }}</p>
            </div>
          </div>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            @for (u of s.upcoming; track u.id) {
              <li class="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0" [class.opacity-50]="u.paid">
                <span class="w-9 h-9 rounded-xl flex flex-col items-center justify-center text-[11px] leading-none font-semibold shrink-0"
                      [class]="u.overdue ? 'bg-rose-50 text-[var(--color-loss)]' : u.paid ? 'bg-emerald-50 text-[var(--color-gain)]' : 'bg-slate-100 text-slate-600'">
                  @if (u.paid) { <lucide-icon [img]="icons.check" [size]="16"></lucide-icon> } @else { <span class="text-sm">{{ u.day }}</span> }
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate" [class.line-through]="u.paid">{{ u.description }}</p>
                  <p class="text-[11px] text-slate-500">{{ u.paid ? 'Registrado' : u.overdue ? 'Venceu dia ' + u.day + ' · sem lançamento' : 'Vence dia ' + u.day }}</p>
                </div>
                <p class="text-sm font-semibold tabular" [class.text-[var(--color-gain)]]="u.type === 'income'">{{ u.type === 'income' ? '+' : '' }}{{ u.amount | brl }}</p>
              </li>
            }
          </ul>
        </section>
      }

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <section class="mx-card p-5 sm:p-6 mx-rise" style="animation-delay: 260ms">
          <h2 class="mx-section-title mb-4">Receitas e despesas · 6 meses</h2>
          <app-line-chart [data]="trendData()"></app-line-chart>
        </section>

        <section class="mx-card p-5 sm:p-6 mx-rise" style="animation-delay: 300ms">
          <h2 class="mx-section-title mb-4">Onde está o seu dinheiro</h2>
          @if (s.allocation.length) {
            <div class="grid grid-cols-1 sm:grid-cols-[176px_1fr] gap-6 items-center">
              <mx-donut [items]="donutItems()" centerLabel="Ativos" [centerValue]="shortBrl(s.assets)"></mx-donut>
              <ul class="space-y-2.5">
                @for (a of s.allocation; track a.assetClass) {
                  <li class="flex items-center gap-2.5 text-sm">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="classColor(a.assetClass)"></span>
                    <span class="flex-1 text-slate-700">{{ label(a.assetClass) }}</span>
                    <span class="tabular text-slate-900 font-medium">{{ a.percent }}%</span>
                  </li>
                }
              </ul>
            </div>
          } @else { <p class="text-sm text-slate-500">Nenhum ativo cadastrado.</p> }
        </section>

        <section class="mx-card p-5 sm:p-6 mx-rise xl:col-span-2" style="animation-delay: 340ms">
          <div class="flex items-center justify-between mb-5">
            <h2 class="mx-section-title">Orçamento do mês</h2>
            <a routerLink="/mixco/fluxo" class="btn-link">Ajustar limites</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            @for (b of shownBudget(); track b.category) {
              <div>
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="flex items-center gap-2 text-slate-800 font-medium">
                    <span class="w-2 h-2 rounded-full" [style.background]="catColor(b.category)"></span>{{ b.category }}
                  </span>
                  <span class="tabular text-slate-500">
                    <b [class.text-[var(--color-loss)]]="b.over" [class.text-slate-900]="!b.over">{{ b.spent | brl }}</b>{{ b.limit ? ' / ' + (b.limit | brl) : '' }}
                  </span>
                </div>
                <div class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="mx-bar" [style.width.%]="b.limit ? Math.min(b.percent ?? 0, 100) : barShare(b.spent)"
                       [style.background]="b.over ? 'linear-gradient(90deg,#f0707f,#e0455a)' : b.limit ? 'linear-gradient(90deg,#3fd9b8,#1d7f8f)' : catColor(b.category) + '99'"></div>
                </div>
                @if (b.previous > 0) { <p class="mt-1 text-[11px] text-slate-400">Mês anterior: {{ b.previous | brl }}</p> }
              </div>
            } @empty { <p class="text-sm text-slate-500">Sem despesas neste mês.</p> }
          </div>
          @if (s.budget.length > 6) {
            <button type="button" class="btn-link mt-3" (click)="showAllBudget.set(!showAllBudget())">{{ showAllBudget() ? 'Mostrar menos' : 'Ver todas (' + s.budget.length + ')' }}</button>
          }
        </section>
      </div>
    }
  } @else {
    <div class="space-y-4" aria-busy="true">
      <div class="h-44 rounded-3xl bg-slate-200/60 animate-pulse"></div>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4"><div class="h-28 rounded-2xl bg-slate-200/60 animate-pulse" *ngFor="let _ of [1,2,3,4]"></div></div>
    </div>
  }
</main>`,
})
export class MixcoOverviewComponent implements OnInit {
  mixco = inject(MixcoService);
  readonly Math = Math;
  readonly icons = { refresh: RefreshCw, up: ArrowUpRight, down: ArrowDownRight, go: ArrowRight, landmark: Landmark, check: Check };
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

  showAllInsights = signal(false);
  showAllBudget = signal(false);
  shownInsights = computed(() => { const i = this.s()?.insights ?? []; return this.showAllInsights() ? i : i.slice(0, 3); });
  shownBudget = computed(() => { const b = this.s()?.budget ?? []; return this.showAllBudget() ? b : b.slice(0, 6); });

  greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  });

  /** Variação do patrimônio em relação à foto do mês anterior. */
  netDelta = computed(() => {
    const h = this.s()?.history ?? [];
    return h.length >= 2 ? { value: Math.round((h[h.length - 1].netWorth - h[h.length - 2].netWorth) * 100) / 100 } : null;
  });
  /** Curva do hero: patrimônio por mês; sem histórico, o saldo poupado nos últimos meses. */
  sparkValues = computed(() => {
    const s = this.s();
    if (!s) return [];
    return s.history.length >= 2 ? s.history.map(h => h.netWorth) : s.trend.map(t => t.saved);
  });

  kpis = computed(() => {
    const s = this.s();
    if (!s) return [];
    const good = '#0f9d6b', bad = '#e0455a', ink = '#0f172a';
    const rate = s.flow.savingsRate;
    const m = s.emergencyFund.months;
    const delta = s.flow.previousExpense > 0 ? Math.round(((s.flow.expense - s.flow.previousExpense) / s.flow.previousExpense) * 100) : null;
    return [
      { label: 'Poupança', icon: PiggyBank, color: '#0f9d6b', tint: '#e6f7f1', value: rate === null ? '—' : `${rate}%`,
        valueColor: rate === null ? ink : rate >= 20 ? good : rate < 0 ? bad : ink, hint: `Sobrou ${this.fmt(s.flow.saved)} de ${this.fmt(s.flow.income)}` },
      { label: 'Reserva', icon: ShieldCheck, color: '#3b6fa0', tint: '#e8f0f8', value: m === null ? '—' : `${m} meses`,
        valueColor: m === null ? ink : m >= 6 ? good : m < 3 ? bad : ink, hint: this.reserveHint() },
      { label: 'Gasto do mês', icon: Receipt, color: '#8b5cf6', tint: '#f1ecfd', value: this.fmt(s.flow.expense), valueColor: ink,
        hint: delta === null ? 'Sem mês anterior para comparar' : `${delta >= 0 ? '+' : ''}${delta}% vs. mês anterior` },
      { label: 'Investimentos', icon: TrendingUp, color: '#f59e0b', tint: '#fef4e2',
        value: s.investments.returnPercent === null ? '—' : `${s.investments.returnPercent}%`,
        valueColor: s.investments.profit > 0 ? good : s.investments.profit < 0 ? bad : ink,
        hint: `${this.fmt(s.investments.profit)} sobre ${this.fmt(s.investments.invested)}` },
    ];
  });

  donutItems = computed(() => (this.s()?.allocation ?? []).map(a => ({ key: a.assetClass, value: a.value, color: colorOfClass(a.assetClass) })));
  classColor = colorOfClass;
  catColor = colorOfCategory;
  /** Sem limite definido, a barra mostra o peso da categoria no gasto total. */
  barShare(v: number): number {
    const total = this.s()?.flow.expense || 0;
    return total ? Math.max(4, (v / total) * 100) : 0;
  }
  fmt(v: number): string { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  shortBrl(v: number): string {
    const a = Math.abs(v);
    return a >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi` : a >= 1e3 ? `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : this.fmt(v);
  }

  label(c: string): string { return ASSET_CLASS_LABELS[c] ?? c; }

  tone(i: MxInsight) {
    return {
      alert: { bar: '#e0455a', tint: '#fdecee', icon: CircleAlert },
      warn: { bar: '#f59e0b', tint: '#fef4e2', icon: TriangleAlert },
      info: { bar: '#3b6fa0', tint: '#e8f0f8', icon: Info },
      ok: { bar: '#0f9d6b', tint: '#e6f7f1', icon: CircleCheck },
    }[i.level];
  }

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
