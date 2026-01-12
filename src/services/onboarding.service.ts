import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/company.model';
import { environment } from '../environments/environment';

/**
 * Serviço para gerenciar o processo de onboarding (primeiro uso) do usuário.
 *
 * Controla se o usuário já completou o setup inicial, gerencia o perfil da empresa
 * e persiste o estado de onboarding no `localStorage` para garantir que o usuário
 * não precise refazer o processo a cada visita.
 */
@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendUrl}/api`;

  private storageKey = 'sobrai_onboarding_complete_v1';
  private firstRunKey = 'sobrai_first_run_complete_v1';

  /** Sinal (Signal) que indica se o processo de onboarding foi concluído. */
  isOnboardingComplete = signal<boolean>(false);

  /** Sinal (Signal) que armazena os dados do perfil da empresa. */
  companyProfile = signal<CompanyProfile | null>(null);

  /**
   * Inicializa o serviço, verificando o status de onboarding no `localStorage`.
   * Se o onboarding estiver completo, carrega os dados do perfil da empresa.
   */
  initialize() {
    console.log('Inicializando OnboardingService...');
    try {
      const isComplete = localStorage.getItem(this.storageKey) === 'true';
      console.log('Onboarding completo?', isComplete);
      this.isOnboardingComplete.set(isComplete);

      if (isComplete) {
        this.loadCompanyProfile();
      }
    } catch (error) {
      console.error('Erro ao inicializar OnboardingService:', error);
    }
  }

  /**
   * Carrega os dados do perfil da empresa a partir da API backend.
   * @private
   */
  private loadCompanyProfile() {
    console.log('Carregando perfil da empresa do servidor...');
    this.http.get<CompanyProfile>(`${this.apiUrl}/company-profile`).subscribe({
      next: (profile) => {
        console.log('Perfil carregado:', profile);
        this.companyProfile.set(profile);
      },
      error: (err) => {
        console.error('Erro ao carregar perfil da empresa:', err);
      }
    });
  }

  /**
   * Salva (atualiza) os dados do perfil da empresa na API backend.
   * @param profile O objeto de perfil da empresa a ser salvo.
   */
  saveCompanyProfile(profile: CompanyProfile) {
    console.log('Tentando salvar perfil da empresa no backend:', profile);
    this.http.put<CompanyProfile>(`${this.apiUrl}/company-profile`, profile).subscribe({
      next: (updatedProfile) => {
        console.log('Perfil salvo com sucesso no backend:', updatedProfile);
        this.companyProfile.set(updatedProfile);
      },
      error: (err) => {
        console.warn('Erro ao salvar perfil da empresa no backend (backend pode estar offline):', err);
        // Não falha completamente se o backend estiver offline
        // O perfil já foi definido no signal localmente
      }
    });
  }

  /**
   * Marca o processo de onboarding como concluído.
   * Salva o estado no `localStorage` e atualiza o `signal` `isOnboardingComplete`.
   * Só conclui se o perfil da empresa já estiver definido.
   */
  completeOnboarding() {
    // Verifica se o perfil da empresa está definido no signal
    const profile = this.companyProfile();
    if (profile) {
      localStorage.setItem(this.storageKey, 'true');
      this.isOnboardingComplete.set(true);
      console.log('Onboarding marcado como completo para:', profile.name);
    } else {
      console.error('Não foi possível completar o onboarding: perfil da empresa não encontrado');
    }
  }

  /**
   * Verifica se é a primeira vez que o usuário executa a aplicação.
   * Útil para exibir telas de boas-vindas ou tutoriais.
   * @returns `true` se for a primeira execução, `false` caso contrário.
   */
  isFirstRun(): boolean {
    return localStorage.getItem(this.firstRunKey) === null;
  }

  /**
   * Marca que a primeira execução da aplicação foi concluída.
   * Isso impede que as telas de boas-vindas sejam exibidas novamente.
   */
  markFirstRunComplete() {
    localStorage.setItem(this.firstRunKey, 'true');
  }
}
