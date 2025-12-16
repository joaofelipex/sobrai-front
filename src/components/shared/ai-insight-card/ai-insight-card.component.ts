
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Insight } from '../../../models/insight.model';

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insight-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiInsightCardComponent {
  insight = input.required<Insight>();
}
