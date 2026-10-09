import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal } from '../../../models/goal.model';
import { GoalService } from '../../../services/goal.service';
import { TransactionService } from '../../../services/transaction.service';
import { ToastService } from '../../../services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  providers: [DatePipe],
  templateUrl: './goals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalsComponent implements OnInit {
  goalService = inject(GoalService);
  transactionService = inject(TransactionService);
  toastService = inject(ToastService);
  datePipe = inject(DatePipe);

  goals = this.goalService.goals;
  totalRevenue = this.transactionService.totalRevenue;
  balance = this.transactionService.balance;
  isModalOpen = signal(false);
  editingGoalId = signal<string | null>(null);
  goalPendingDelete = signal<Goal | null>(null);
  isLoading = signal(true);

  newGoal = signal({
    name: '',
    type: 'revenue' as 'revenue' | 'savings',
    targetAmount: 10000,
    deadline: this.getTomorrowDateString(),
  });

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  openModal() {
    this.editingGoalId.set(null);
    this.resetNewGoal();
    this.isModalOpen.set(true);
  }

  openEditModal(goal: Goal) {
    this.editingGoalId.set(goal.id);
    this.newGoal.set({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline.slice(0, 10),
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingGoalId.set(null);
  }

  saveGoal() {
    const goal = this.newGoal();
    if (!(goal.name && goal.targetAmount > 0 && goal.deadline)) return;

    const editingId = this.editingGoalId();
    if (editingId) {
      this.goalService.updateGoal({ id: editingId, ...goal });
    } else {
      this.goalService.addGoal(goal);
      this.toastService.show('Meta criada com sucesso!');
    }
    this.resetNewGoal();
    this.closeModal();
  }

  confirmDelete() {
    const goal = this.goalPendingDelete();
    if (goal) this.goalService.deleteGoal(goal.id);
    this.goalPendingDelete.set(null);
  }

  private getTomorrowDateString(): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.datePipe.transform(tomorrow, 'yyyy-MM-dd') || '';
  }

  private resetNewGoal() {
    this.newGoal.set({
      name: '',
      type: 'revenue',
      targetAmount: 10000,
      deadline: this.getTomorrowDateString(),
    });
  }

  calculateCurrentAmount(goal: Goal): number {
    if (goal.type === 'revenue') {
      return this.totalRevenue();
    }
    // For savings goal, the current amount is the balance (revenue - expenses)
    return this.balance();
  }

  calculateProgress(goal: Goal): number {
    const currentAmount = this.calculateCurrentAmount(goal);
    if (goal.targetAmount === 0) return 0;
    // For savings, progress can be negative, so we clamp it at 0.
    const progress = (currentAmount / goal.targetAmount) * 100;
    return Math.max(0, Math.min(progress, 100));
  }

  getDaysRemaining(deadline: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline + 'T00:00:00');
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days < 0 ? 0 : days;
  }
}
