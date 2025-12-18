import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Insight } from '../../../models/insight.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-insight-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiInsightCardComponent {
  insight = input.required<Insight>();
}