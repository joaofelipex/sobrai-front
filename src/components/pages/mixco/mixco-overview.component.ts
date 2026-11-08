import { Component, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MixcoService } from '../../../services/mixco.service';
import { ASSET_CLASS_LABELS } from '../../../models/mixco.model';
import { LineChartComponent } from '../../shared/chart/line-chart.component';
import { BrlPipe } from './brl.pipe';

/** Visão geral do MiXCo: patrimônio líquido, evolução, alocação, orçamento e saúde financeira. */
@Component({
  selector: 'app-mixco-overview',
  standalone: true,
  imports: [RouterModule, LineChartComponent, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8">
  <div class="mb-6">
    <h1 class="text-xl font-semibold text-slate-900">MiXCo</h1>
    <p class="text-sm text-slate-500 mt-0.5">Seu patrimônio, seu fluxo de caixa e o que fazer a seguir.</p>
  </div>

  @if (s(); as s) {
    @if (isEmpty()) {
      <div class="text-center py-16 px-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
        <h3 class="text-xl font-semibold text-slate-800">Comece pelo que você tem</h3>
        <p class="mt-2 text-slate-500 max-w-md mx-auto">Cadastre suas contas e lançamentos, depois seus investimentos, bens e dívidas. O MiXCo calcula o resto.</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/mixco/fluxo" class="btn-primary">Cadastrar contas e lançamentos</a>
          <a routerLink="/mixco/patrimonio" class="btn-secondary">Cadastrar bens e dívidas</a>
        </div>
      </div>
    } @else {
      <!-- Patrimônio líquido -->
      <section class="bg-slate-900 text-white rounded-lg p-6 mb-6">
        <p class="text-sm text-slate-400">Patrimônio líquido</p>
        <p class="text-3xl sm:text-4xl font-semibold tabular mt-1" [class.text-red-300]="s.netWorth < 0">{{ s.netWorth | brl }}</p>
        <div class="mt-4 grid grid-cols-2 gap-4 max-w-md text-sm">
          <div><p class="text-slate-400">Ativos</p><p class="font-medium tabular">{{ s.assets | brl }}</p></div>
          <div><p class="text-slate-400">Dívidas</p><p class="font-medium tabular">{{ s.liabilities | brl }}</p></div>
        </div>
      </section>

      <!-- Indicadores -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Taxa de poupança ({{ s.month }})</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.flow.savingsRate === null ? '—' : s.flow.savingsRate + '%' }}</p>
          <p class="text-xs text-slate-500 mt-1">Sobrou {{ s.flow.saved | brl }}</p>
        </div>
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Reserva de emergência</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.emergencyFund.months === null ? '—' : s.emergencyFund.months + ' meses' }}</p>
          <p class="text-xs mt-1" [class.text-red-700]="reserveLow()" [class.text-slate-500]="!reserveLow()">{{ reserveHint() }}</p>
        </div>
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">Endividamento</p>
          <p class="text-xl font-semibold tabular mt-1">{{ s.debtToAssets === null ? '—' : s.debtToAssets + '%' }}</p>
          <p class="text-xs text-slate-500 mt-1">Parcelas: {{ s.monthlyDebtPayments | brl }}/mês</p>
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

        <section class="bg-white border border-slate-200/80 rounded-lg p-5 xl:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-slate-800">Orçamento do mês</h2>
            <a routerLink="/mixco/fluxo" class="text-sm text-emerald-700 hover:underline">Ajustar</a>
          </div>
          @for (b of s.budget; track b.category) {
            <div class="mb-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-700">{{ b.category }}</span>
                <span class="tabular" [class.text-red-700]="b.over" [class.text-slate-500]="!b.over">
                  {{ b.spent | brl }}{{ b.limit ? ' de ' + (b.limit | brl) : '' }}
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
  private mixco = inject(MixcoService);
  readonly Math = Math;
  s = this.mixco.summary;
  readonly chartColors = { 'Patrimônio': '#2c5a86' };

  isEmpty = computed(() => {
    const s = this.s();
    return !s || (s.assets === 0 && s.liabilities === 0 && s.flow.income === 0 && s.flow.expense === 0);
  });

  chartData = computed(() =>
    (this.s()?.history ?? []).map(h => ({ name: h.month.slice(5) + '/' + h.month.slice(2, 4), 'Patrimônio': h.netWorth })));

  reserveLow = computed(() => {
    const m = this.s()?.emergencyFund.months;
    return m !== null && m !== undefined && m < 6;
  });
  reserveHint = computed(() => {
    const e = this.s()?.emergencyFund;
    if (!e || e.months === null) return 'Sem despesas nos 3 meses anteriores para calcular';
    return e.months < 6 ? 'Meta usual: 6 meses de despesas' : 'Dentro da meta de 6 meses';
  });

  label(c: string): string { return ASSET_CLASS_LABELS[c] ?? c; }

  ngOnInit() { void this.mixco.loadAll(); }
}
