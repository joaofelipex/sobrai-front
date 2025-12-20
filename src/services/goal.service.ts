
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Goal } from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  goals = signal<Goal[]>([]);

  constructor() {
    this.loadGoalsFromServer();
  }

  private loadGoalsFromServer() {
    this.http.get<Goal[]>(`${this.apiUrl}/goals`).subscribe({
      next: (data) => {
        this.goals.set(data);
      },
      error: (err) => console.error('Failed to load goals from server', err)
    });
  }

  getGoals(): Goal[] {
    return this.goals();
  }

  addGoal(goalData: Omit<Goal, 'id'>): void {
    this.http.post<Goal>(`${this.apiUrl}/goals`, goalData).subscribe({
      next: (newGoal) => {
        this.goals.update(goals => [...goals, newGoal]);
      },
      error: (err) => console.error('Failed to add goal', err)
    });
  }
}
