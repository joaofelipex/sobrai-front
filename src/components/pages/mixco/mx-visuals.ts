import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';

/** Cor estável por categoria (círculos e legendas). */
export const CATEGORY_COLORS: Record<string, string> = {
  'Moradia': '#6366f1', 'Alimentação': '#f59e0b', 'Transporte': '#0ea5e9', 'Saúde': '#ef4444',
  'Educação': '#8b5cf6', 'Lazer': '#ec4899', 'Assinaturas': '#14b8a6', 'Impostos': '#64748b',
  'Salário': '#10b981', 'Rendimentos': '#22c55e', 'Freelance': '#06b6d4', 'Presentes': '#f472b6',
  'Pagamento de fatura': '#94a3b8', 'Transferência interna': '#94a3b8', 'Outros': '#a8a29e',
};
export const colorOfCategory = (c: string) => CATEGORY_COLORS[c] ?? '#a8a29e';

/** Cor por classe de ativo (rosca de alocação). */
export const CLASS_COLORS: Record<string, string> = {
  caixa: '#3fd9b8', renda_fixa: '#3b6fa0', renda_variavel: '#8b5cf6', fiis: '#f59e0b',
  cripto: '#f97316', imoveis: '#0ea5e9', veiculos: '#64748b', previdencia: '#ec4899', outros: '#a8a29e',
};
export const colorOfClass = (c: string) => CLASS_COLORS[c] ?? '#a8a29e';

/** Linha de tendência com área em degradê. Poucos pontos viram uma linha reta discreta. */
@Component({
  selector: 'mx-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
<svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" class="w-full h-full overflow-visible" aria-hidden="true">
  <defs>
    <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" [attr.stop-color]="color()" stop-opacity="0.45" />
      <stop offset="1" [attr.stop-color]="color()" stop-opacity="0" />
    </linearGradient>
  </defs>
  <path [attr.d]="area()" [attr.fill]="'url(#' + gid + ')'" />
  <path [attr.d]="line()" fill="none" [attr.stroke]="color()" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        vector-effect="non-scaling-stroke" pathLength="1" stroke-dasharray="1" class="[animation:mx-draw_1.2s_ease-out_both] [--len:1]" />
  @if (last(); as p) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" [attr.fill]="color()" vector-effect="non-scaling-stroke" /> }
</svg>`,
})
export class SparklineComponent {
  values = input.required<number[]>();
  color = input('#3fd9b8');
  readonly W = 300;
  readonly H = 80;
  readonly gid = 'sp' + Math.random().toString(36).slice(2, 8);

  private pts = computed(() => {
    const v = this.values().length >= 2 ? this.values() : [0, 0];
    const min = Math.min(...v), max = Math.max(...v);
    const span = max - min || 1;
    return v.map((n, i) => ({ x: (i / (v.length - 1)) * this.W, y: 8 + (1 - (n - min) / span) * (this.H - 16) }));
  });
  /** Curva suave (Catmull-Rom convertida em Bézier). */
  line = computed(() => {
    const p = this.pts();
    let d = `M${p[0].x},${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
      d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
    }
    return d;
  });
  area = computed(() => `${this.line()} L${this.W},${this.H} L0,${this.H} Z`);
  last = computed(() => this.pts().at(-1) ?? null);
}

/** Rosca de alocação com total no centro. */
@Component({
  selector: 'mx-donut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
<div class="relative w-44 h-44 mx-auto">
  <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90" role="img" aria-label="Alocação do patrimônio">
    <circle cx="60" cy="60" r="46" fill="none" stroke="#eef1f6" stroke-width="14" />
    @for (s of slices(); track s.key) {
      <circle cx="60" cy="60" r="46" fill="none" [attr.stroke]="s.color" stroke-width="14" stroke-linecap="butt"
              [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset" class="transition-all duration-700" />
    }
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
    <span class="mx-label">{{ centerLabel() }}</span>
    <span class="text-lg font-semibold tabular text-slate-900 leading-tight">{{ centerValue() }}</span>
  </div>
</div>`,
})
export class DonutComponent {
  items = input.required<{ key: string; value: number; color: string }[]>();
  centerLabel = input('Total');
  centerValue = input('');
  private readonly C = 2 * Math.PI * 46;
  slices = computed(() => {
    const total = this.items().reduce((s, i) => s + i.value, 0) || 1;
    const GAP = this.items().length > 1 ? 2 : 0; // fresta entre fatias
    let acc = 0;
    return this.items().map((i) => {
      const len = (i.value / total) * this.C;
      const slice = { key: i.key, color: i.color, dash: `${Math.max(len - GAP, 0.5)} ${this.C}`, offset: -acc };
      acc += len;
      return slice;
    });
  });
}

/** Anel de progresso (metas). */
@Component({
  selector: 'mx-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
<div class="relative" [style.width.px]="size()" [style.height.px]="size()">
  <svg viewBox="0 0 44 44" class="w-full h-full -rotate-90">
    <circle cx="22" cy="22" r="18" fill="none" stroke="#eef1f6" stroke-width="5" />
    <circle cx="22" cy="22" r="18" fill="none" [attr.stroke]="color()" stroke-width="5" stroke-linecap="round"
            [attr.stroke-dasharray]="dash()" class="transition-all duration-700" />
  </svg>
  <span class="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular text-slate-800">{{ percent().toFixed(0) }}%</span>
</div>`,
})
export class RingComponent {
  percent = input.required<number>();
  color = input('#1fbf9f');
  size = input(72);
  dash = computed(() => { const c = 2 * Math.PI * 18; return `${(Math.min(100, Math.max(0, this.percent())) / 100) * c} ${c}`; });
}
