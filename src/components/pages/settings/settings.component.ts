
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../../services/onboarding.service';
import { CompanyProfile } from '../../../models/company.model';
import { ToastService } from '../../../services/toast.service';
import { NfseSettingsComponent } from './nfse-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NfseSettingsComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  toastService = inject(ToastService);
  
  companyProfile = signal<CompanyProfile>({
    name: '', type: 'mei', monthlyRevenue: 0
  });

  companyTypes = [
    { id: 'mei', name: 'MEI' },
    { id: 'simples', name: 'Simples Nacional' },
    { id: 'autonomo', name: 'Autônomo' }
  ];

  ngOnInit() {
    const currentProfile = this.onboardingService.companyProfile();
    if (currentProfile) {
      this.companyProfile.set({ ...currentProfile });
    }
  }

  saveSettings() {
    const profile = this.companyProfile();
    if (profile.name && profile.monthlyRevenue > 0) {
      this.onboardingService.saveCompanyProfile(profile);
      this.toastService.show('Configurações salvas com sucesso!');
    } else {
      this.toastService.show('Por favor, preencha todos os campos.', 'error');
    }
  }
}
