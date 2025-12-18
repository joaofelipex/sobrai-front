
import { Injectable, signal } from '@angular/core';
import { CompanyProfile } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private storageKey = 'sobrai_onboarding_complete_v1';
  private companyProfileKey = 'sobrai_company_profile_v1';
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
        const profileData = localStorage.getItem(this.companyProfileKey);
        console.log('Dados do perfil encontrados:', !!profileData);
        if (profileData) {
          const parsedProfile = JSON.parse(profileData);
          console.log('Perfil carregado:', parsedProfile);
          this.companyProfile.set(parsedProfile);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar OnboardingService:', error);
    }
  }

  saveCompanyProfile(profile: CompanyProfile) {
    this.companyProfile.set(profile);
    localStorage.setItem(this.companyProfileKey, JSON.stringify(profile));
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
