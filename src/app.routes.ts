import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoicesComponent } from './components/pages/invoices/invoices.component';
import { FinancialComponent } from './components/pages/financial/financial.component';
import { ReportsComponent } from './components/pages/reports/reports.component';
import { SettingsComponent } from './components/pages/settings/settings.component';
import { SubscriptionComponent } from './components/pages/subscription/subscription.component';
import { BankIntegrationComponent } from './components/pages/bank-integration/bank-integration.component';
import { FinancialAnalysisComponent } from './components/pages/financial-analysis/financial-analysis.component';
import { AiInsightsPageComponent } from './components/pages/ai-insights-page/ai-insights-page.component';

export const routes: Routes = [
    { path: '', redirectTo: 'painel-principal', pathMatch: 'full' },
    { path: 'painel-principal', component: DashboardComponent, title: 'Painel Principal | Sobrai' },
    { path: 'receitas-e-despesas', component: FinancialComponent, title: 'Receitas e Despesas | Sobrai' },
    { path: 'integracao-bancaria', component: BankIntegrationComponent, title: 'Integração Bancária | Sobrai' },
    { path: 'notas-fiscais', component: InvoicesComponent, title: 'Notas Fiscais | Sobrai' },
    { path: 'analise-financeira', component: FinancialAnalysisComponent, title: 'Análise Financeira | Sobrai' },
    { path: 'insights-ia', component: AiInsightsPageComponent, title: 'Insights da IA | Sobrai' },
    { path: 'relatorios', component: ReportsComponent, title: 'Relatórios | Sobrai' },
    { path: 'assinatura', component: SubscriptionComponent, title: 'Assinatura | Sobrai' },
    { path: 'configuracoes', component: SettingsComponent, title: 'Configurações | Sobrai' },
    { path: '**', redirectTo: 'painel-principal' } // Rota coringa para redirecionar URLs inválidas
];
