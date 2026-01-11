import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { CompanyProfile } from '../../models/company.model';

/**
 * Componente responsável pelo processo de onboarding do usuário.
 * Guia o usuário através de um formulário de múltiplos passos para coletar informações essenciais da empresa.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // Estratégia de detecção de alterações para otimização de performance.
})
export class OnboardingComponent {
  // Injeção de dependência do serviço de onboarding.
  onboardingService = inject(OnboardingService);
  // Signal para controlar o passo atual do formulário de onboarding.
  currentStep = signal(1);

  // Signal que armazena os dados do perfil da empresa, inicializado com valores padrão.
  companyProfile = signal<CompanyProfile>({
    name: '',
    type: 'mei',
    monthlyRevenue: 5000
  });

  // Array com os tipos de empresa disponíveis para seleção.
  companyTypes = [
    { id: 'mei', name: 'MEI', description: 'Para quem fatura até R$ 81 mil por ano.' },
    { id: 'simples', name: 'Simples Nacional', description: 'Para micro e pequenas empresas.' },
    { id: 'autonomo', name: 'Autônomo', description: 'Para profissionais sem CNPJ.' }
  ];

  /**
   * Avança para o próximo passo do onboarding.
   */
  nextStep() {
    this.currentStep.update(step => step + 1);
  }

  /**
   * Retorna ao passo anterior do onboarding.
   */
  prevStep() {
    this.currentStep.update(step => step - 1);
  }

  /**
   * Retorna o nome do tipo de empresa com base no ID selecionado.
   * @returns O nome do tipo de empresa ou uma string vazia se não for encontrado.
   */
  getCompanyTypeName(): string {
    const type = this.companyTypes.find(t => t.id === this.companyProfile().type);
    return type ? type.name : '';
  }

  /**
   * Reinicia o processo de onboarding para o primeiro passo, permitindo a revisão das configurações.
   */
  reviewSettings() {
    this.currentStep.set(1);
  }

  /**
   * Placeholder para a funcionalidade de visualização de tutorial.
   */
  viewTutorial() {
    // Placeholder for tutorial functionality
    console.log('Tutorial functionality to be implemented');
  }

  /**
   * Finaliza o processo de onboarding, salvando os dados do perfil da empresa
   * e marcando o onboarding como completo através do OnboardingService.
   */
  finishOnboarding() {
    this.onboardingService.saveCompanyProfile(this.companyProfile());
    this.onboardingService.completeOnboarding();
  }
}