
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Metric } from '../../../models/metric.model';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './metric-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  metric = input.required<Metric>();
  link = input<any[] | null>(null);
}
