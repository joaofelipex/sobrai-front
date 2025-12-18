
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LineChartData {
  name: string;
  [key: string]: any;
}

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
  
  keys = computed(() => {
    if (this.data().length === 0) return [];
    return Object.keys(this.data()[0]).filter(k => k !== 'name');
  });

  colors = computed(() => ({
    'Receita': '#1db865',
    'Despesa': '#ef4444',
    ...this.chartColors()
  }));

  points = computed(() => {
    const data = this.data();
    if (data.length < 2) return { paths: [], labels: [] };
    
    const allValues = data.flatMap(d => this.keys().map(key => d[key]));
    const maxValue = Math.max(...allValues, 0);
    const width = 300;
    const height = 150;
    
    const labels = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height + 20,
        name: d.name
    }));

    const paths = this.keys().map(key => {
      const color = this.colors()[key] || '#6b7280';
      const pathData = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d[key] / maxValue) * height;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ');
      return { d: pathData, stroke: color, name: key };
    });
    
    return { paths, labels };
  });
}
