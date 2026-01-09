
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { CompanyProfile } from '../../models/company.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingComponent {
  onboardingService = inject(OnboardingService);
  currentStep = signal(1);

  companyProfile = signal<CompanyProfile>({
    name: '',
    type: 'mei',
    monthlyRevenue: 5000
  });

  companyTypes = [
    { id: 'mei', name: 'MEI', description: 'Para quem fatura até R$ 81 mil por ano.' },
    { id: 'simples', name: 'Simples Nacional', description: 'Para micro e pequenas empresas.' },
    { id: 'autonomo', name: 'Autônomo', description: 'Para profissionais sem CNPJ.' }
  ];

  nextStep() {
    this.currentStep.update(step => step + 1);
  }

  prevStep() {
    this.currentStep.update(step => step - 1);
  }

  getCompanyTypeName(): string {
    const type = this.companyTypes.find(t => t.id === this.companyProfile().type);
    return type ? type.name : '';
  }

  reviewSettings() {
    this.currentStep.set(1);
  }

  viewTutorial() {
    // Placeholder for tutorial functionality
    console.log('Tutorial functionality to be implemented');
  }

  finishOnboarding() {
    this.onboardingService.saveCompanyProfile(this.companyProfile());
    this.onboardingService.completeOnboarding();
  }
}
