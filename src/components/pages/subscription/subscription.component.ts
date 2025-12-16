import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../services/subscription.service';
import { ToastService } from '../../../services/toast.service';
import { SubscriptionPlan } from '../../../models/subscription.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionComponent {
  subscriptionService = inject(SubscriptionService);
  toastService = inject(ToastService);

  plans = this.subscriptionService.availablePlans;
  currentPlanId = this.subscriptionService.currentPlanId;
  billingHistory = this.subscriptionService.billingHistory;

  selectPlan(plan: SubscriptionPlan) {
    if (plan.id === this.currentPlanId()) return;

    this.subscriptionService.changePlan(plan.id);
    this.toastService.show(`Plano alterado para ${plan.name} com sucesso!`);
  }
}
