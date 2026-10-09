import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Goal } from '../models/goal.model';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar as metas financeiras do usuário.
 *
 * Responsável por carregar, buscar e adicionar metas,
 * interagindo com a API backend e mantendo o estado das metas
 * sincronizado através de um sinal (Signal).
 */
@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.backendUrl}/api`;

  /**
   * Sinal (Signal) que armazena a lista de metas financeiras.
   * A lista é reativa, e os componentes que a utilizam são atualizados
   * automaticamente quando seu valor muda.
   */
  goals = signal<Goal[]>([]);

  /**
   * Construtor do serviço.
   * Inicia o carregamento das metas do servidor assim que o serviço é instanciado.
   */
  constructor() {
    this.loadGoalsFromServer();
  }

  /**
   * Carrega a lista de metas a partir do servidor.
   * Faz uma requisição GET para a API e atualiza o `signal` de metas.
   * @private
   */
  private loadGoalsFromServer() {
    this.http.get<Goal[]>(`${this.apiUrl}/goals`).subscribe({
      next: (data) => {
        this.goals.set(data);
      },
      error: (err) => {
        console.error('Failed to load goals from server', err);
        this.toastService.showError('Não foi possível carregar as metas.');
      }
    });
  }

  /**
   * Retorna a lista atual de metas.
   * @returns Um array de `Goal`.
   */
  getGoals(): Goal[] {
    return this.goals();
  }

  /**
   * Adiciona uma nova meta.
   * Envia os dados da nova meta para a API via POST e, em caso de sucesso,
   * atualiza a lista de metas local.
   * @param goalData Os dados da meta a serem adicionados, sem o campo `id`.
   */
  addGoal(goalData: Omit<Goal, 'id'>): void {
    this.http.post<Goal>(`${this.apiUrl}/goals`, goalData).subscribe({
      next: (newGoal) => {
        this.goals.update(goals => [...goals, newGoal]);
      },
      error: (err) => {
        console.error('Failed to add goal', err);
        this.toastService.showError('Não foi possível criar a meta.');
      }
    });
  }

  /**
   * Atualiza uma meta existente.
   * @param goal A meta com os dados atualizados.
   */
  updateGoal(goal: Goal): void {
    this.http.put<Goal>(`${this.apiUrl}/goals/${goal.id}`, goal).subscribe({
      next: (saved) => {
        this.goals.update(goals => goals.map(g => g.id === saved.id ? saved : g));
        this.toastService.show('Meta atualizada com sucesso!');
      },
      error: (err) => {
        console.error('Failed to update goal', err);
        this.toastService.showError('Não foi possível atualizar a meta.');
      }
    });
  }

  /**
   * Exclui uma meta pelo ID.
   */
  deleteGoal(id: string): void {
    this.http.delete(`${this.apiUrl}/goals/${id}`).subscribe({
      next: () => {
        this.goals.update(goals => goals.filter(g => g.id !== id));
        this.toastService.show('Meta excluída.', 'info');
      },
      error: (err) => {
        console.error('Failed to delete goal', err);
        this.toastService.showError('Não foi possível excluir a meta.');
      }
    });
  }
}
