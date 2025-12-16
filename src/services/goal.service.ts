
import { Injectable, signal, effect } from '@angular/core';
import { Goal } from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private storageKey = 'sobrai_goals_v1';
  goals = signal<Goal[]>([]);

  constructor() {
    this.loadGoalsFromStorage();
    // Salva as metas no localStorage sempre que o sinal for atualizado
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.goals()));
    });
  }

  private loadGoalsFromStorage() {
    const storedGoals = localStorage.getItem(this.storageKey);
    if (storedGoals) {
      this.goals.set(JSON.parse(storedGoals));
    }
  }

  getGoals(): Goal[] {
    return this.goals();
  }

  addGoal(goalData: Omit<Goal, 'id'>): void {
    const newGoal: Goal = {
      ...goalData,
      id: self.crypto.randomUUID(),
    };
    this.goals.update(goals => [...goals, newGoal]);
  }
}
