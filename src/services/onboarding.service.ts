
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';
  
  private storageKey = 'sobrai_onboarding_complete_v1';
  private firstRunKey = 'sobrai_first_run_complete_v1';

  isOnboardingComplete = signal<boolean>(false);
  companyProfile = signal<CompanyProfile | null>(null);

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

  saveCompanyProfile(profile: CompanyProfile) {
    this.http.put<CompanyProfile>(`${this.apiUrl}/company-profile`, profile).subscribe({
      next: (updatedProfile) => {
        this.companyProfile.set(updatedProfile);
      },
      error: (err) => console.error('Erro ao salvar perfil da empresa:', err)
    });
  }

  completeOnboarding() {
    if (this.companyProfile()) {
      localStorage.setItem(this.storageKey, 'true');
      this.isOnboardingComplete.set(true);
    }
  }

  isFirstRun(): boolean {
    return localStorage.getItem(this.firstRunKey) === null;
  }

  markFirstRunComplete() {
    localStorage.setItem(this.firstRunKey, 'true');
  }
}
