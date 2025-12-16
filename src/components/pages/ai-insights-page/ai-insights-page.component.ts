import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ai-insights-page',
  standalone: true,
  template: `<div class="p-8">
    <h1 class="text-3xl font-bold text-slate-800">Insights da IA</h1>
    <p class="text-slate-500 mt-2">Página em construção</p>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiInsightsPageComponent {}
