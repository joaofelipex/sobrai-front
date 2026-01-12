import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);
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
   * Atualiza o nome da empresa no estado do perfil da empresa.
   * @param name O novo nome da empresa.
   */
  onNameChange(name: string) {
    this.companyProfile.update(profile => ({ ...profile, name }));
  }

  /**
   * Atualiza o tipo de empresa no estado do perfil da empresa.
   * @param type O novo tipo de empresa.
   */
  onTypeChange(type: 'mei' | 'simples' | 'autonomo') {
    this.companyProfile.update(profile => ({ ...profile, type }));
  }

  /**
   * Atualiza o faturamento mensal no estado do perfil da empresa.
   * @param revenue O novo faturamento mensal.
   */
  onRevenueChange(revenue: number) {
    this.companyProfile.update(profile => ({ ...profile, monthlyRevenue: revenue }));
  }

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
   * Calcula a porcentagem de progresso do onboarding.
   * @returns A porcentagem de progresso (0-100)
   */
  getProgressPercentage(): number {
    return Math.min((this.currentStep() - 1) * 33.33, 100);
  }

  /**
   * Finaliza o processo de onboarding, salvando os dados do perfil da empresa,
   * marcando o onboarding como completo e navegando para o painel principal.
   */
  finishOnboarding() {
    console.log('Botão "Acessar meu painel" clicado!');
    console.log('Perfil da empresa:', this.companyProfile());
    
    // Primeiro, define o perfil no serviço para garantir que esteja disponível
    this.onboardingService.companyProfile.set(this.companyProfile());
    
    // Tenta salvar o perfil no backend, mas não espera pela resposta
    // para não bloquear a navegação caso o backend esteja indisponível
    try {
      this.onboardingService.saveCompanyProfile(this.companyProfile());
    } catch (error) {
      console.warn('Não foi possível salvar o perfil no backend (backend pode estar offline):', error);
    }
    
    // Marca o onboarding como completo independentemente do backend
    this.onboardingService.completeOnboarding();
    
    console.log('Navegando para /painel-principal...');
    // Navega para o painel principal
    this.router.navigate(['/painel-principal']);
  }
}