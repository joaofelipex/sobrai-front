
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Goal } from '../../../models/goal.model';

@Component({
  selector: 'app-goal-progress-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './goal-progress-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalProgressCardComponent {
  goal = input.required<Goal>();
  currentAmount = input.required<number>();

  progress = computed(() => {
    const g = this.goal();
    const current = this.currentAmount();
    if (!g || g.targetAmount === 0) {
      return 0;
    }
    return Math.min((current / g.targetAmount) * 100, 100);
  });
}
