
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoicesComponent } from './components/pages/invoices/invoices.component';
import { FinancialComponent } from './components/pages/financial/financial.component';
import { ReportsComponent } from './components/pages/reports/reports.component';
import { SettingsComponent } from './components/pages/settings/settings.component';
import { GoalsComponent } from './components/pages/goals/goals.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | Sobrai' },
    { path: 'notas-fiscais', component: InvoicesComponent, title: 'Notas Fiscais | Sobrai' },
    { path: 'financeiro', component: FinancialComponent, title: 'Financeiro | Sobrai' },
    { path: 'relatorios', component: ReportsComponent, title: 'Relatórios | Sobrai' },
    { path: 'metas', component: GoalsComponent, title: 'Metas | Sobrai' },
    { path: 'configuracoes', component: SettingsComponent, title: 'Configurações | Sobrai' },
    { path: '**', redirectTo: 'dashboard' } // Rota coringa para redirecionar URLs inválidas
];
