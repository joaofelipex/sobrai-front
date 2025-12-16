
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  data = input.required<ChartData[]>();

  maxValue = computed(() => Math.max(...this.data().map(d => d.value), 0));

  getBarHeight(value: number): string {
    const max = this.maxValue();
    return max > 0 ? `${(value / max) * 100}%` : '0%';
  }
}
