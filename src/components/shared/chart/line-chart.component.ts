import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LineChartData {
  name: string;
  [key: string]: any;
}

const W = 640;
const H = 220;
const PAD = { top: 12, right: 24, bottom: 28, left: 56 };

/** Abrevia valores em reais para o eixo (1,2 mil / 3,4 mi). */
function shortCurrency(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return `${sign}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/** Arredonda o teto/piso do eixo para um passo "redondo" (1, 2, 5 × 10ⁿ). */
function niceStep(range: number, ticks: number): number {
  const raw = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

/**
 * Gráfico de linhas em SVG, sem dependências. Cada chave diferente de `name` vira uma série.
 * Aceita valores negativos e desenha eixo de valores com linhas de grade.
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  data = input.required<LineChartData[]>();
  chartColors = input<Record<string, string>>({});

  readonly width = W;
  readonly height = H;

  keys = computed(() => {
    if (this.data().length === 0) return [];
    return Object.keys(this.data()[0]).filter(k => k !== 'name');
  });

  colors = computed<Record<string, string>>(() => ({
    Receita: '#15803d',
    Despesa: '#b91c1c',
    Saldo: '#2c5a86',
    ...this.chartColors(),
  }));

  colorOf(key: string): string {
    return this.colors()[key] || '#64748b';
  }

  chart = computed(() => {
    const data = this.data();
    if (data.length < 2) return null;

    const values = data.flatMap(d => this.keys().map(k => Number(d[k]) || 0));
    let min = Math.min(...values, 0);
    let max = Math.max(...values, 0);
    if (min === max) max = min + 1;

    const step = niceStep(max - min, 4);
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;

    const grid: { y: number; label: string; zero: boolean }[] = [];
    for (let v = min; v <= max + step / 2; v += step) grid.push({ y: y(v), label: shortCurrency(v), zero: Math.abs(v) < step / 2 });

    const series = this.keys().map(key => ({
      key,
      color: this.colorOf(key),
      d: data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(Number(d[key]) || 0).toFixed(1)}`).join(' '),
      last: { x: x(data.length - 1), y: y(Number(data[data.length - 1][key]) || 0) },
    }));

    const labels = data.map((d, i) => ({ x: x(i), y: H - 8, name: d.name }));
    return { grid, series, labels, left: PAD.left, right: W - PAD.right };
  });
}
