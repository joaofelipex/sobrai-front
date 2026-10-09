import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Metric } from '../../../models/metric.model';

// FIX: Removed redundant and conflicting 'change' property. It is now inherited as optional from the base Metric interface.
interface MetricWithStyle extends Metric {
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './metric-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  metric = input.required<MetricWithStyle>();
  link = input<any[] | null>(null);
}