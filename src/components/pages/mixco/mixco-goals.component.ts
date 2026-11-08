import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { MxGoal } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';

/** Metas pessoais com quanto guardar por mês para chegar no prazo. */
@Component({
  selector: 'app-mixco-goals',
  standalone: true,
  imports: [FormsModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Metas</h1>
      <p class="text-sm text-slate-500 mt-0.5">Cada meta mostra quanto guardar por mês para chegar no prazo.</p>
    </div>
    <div class="flex gap-2">
      @if (reserveTarget() > 0) {
        <button type="button" class="btn-secondary" (click)="newReserve()">Meta: reserva de 6 meses</button>
      }
      <button type="button" class="btn-primary" (click)="newGoal()">Nova meta</button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    @for (g of mixco.goals(); track g.id) {
      <section class="bg-white border border-slate-200/80 rounded-lg p-5">
        <div class="flex justify-between gap-3">
          <h2 class="font-semibold text-slate-800">{{ g.name }}</h2>
          <span class="text-xs text-slate-500 whitespace-nowrap">até {{ g.deadline.slice(8) }}/{{ g.deadline.slice(5, 7) }}/{{ g.deadline.slice(0, 4) }}</span>
        </div>
        <div class="mt-3 h-2.5 rounded-full bg-slate-100"><div class="h-2.5 rounded-full bg-emerald-600" [style.width.%]="pct(g)"></div></div>
        <div class="mt-2 flex justify-between text-sm tabular">
          <span class="text-slate-700">{{ g.savedAmount | brl }}</span>
          <span class="text-slate-500">{{ pct(g).toFixed(0) }}% de {{ g.targetAmount | brl }}</span>
        </div>
        <p class="mt-2 text-sm" [class.text-red-700]="late(g)" [class.text-slate-600]="!late(g)">{{ plan(g) }}</p>
        <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-sm">
          <button type="button" class="text-emerald-700 font-medium hover:underline" (click)="deposit.set({ goal: g, amount: monthly(g) || null })">Registrar aporte</button>
          <button type="button" class="text-slate-600 hover:text-emerald-700" (click)="edit(g)">Editar</button>
          <button type="button" class="text-slate-600 hover:text-red-700" (click)="mixco.remove('goals', g.id, 'Meta excluída.')">Excluir</button>
        </div>
      </section>
    } @empty {
      <p class="text-sm text-slate-500 col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-slate-300">
        Nenhuma meta ainda. Comece pela reserva de emergência: é a base de qualquer plano.
      </p>
    }
  </div>

  @if (form(); as f) {
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="form.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-md" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">{{ f.id ? 'Editar meta' : 'Nova meta' }}</h3>
        <form (ngSubmit)="save()" class="p-5 space-y-4">
          <label class="block text-sm font-medium text-slate-700">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Reserva de emergência"></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium text-slate-700">Valor alvo (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="1" name="target" [(ngModel)]="f.targetAmount" required></label>
            <label class="block text-sm font-medium text-slate-700">Já guardado (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="saved" [(ngModel)]="f.savedAmount"></label>
          </div>
          <label class="block text-sm font-medium text-slate-700">Prazo
            <input class="mx-field mt-1" type="date" name="deadline" [(ngModel)]="f.deadline" required></label>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="form.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }

  @if (deposit(); as d) {
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="deposit.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-sm" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">Aporte em "{{ d.goal.name }}"</h3>
        <form (ngSubmit)="saveDeposit()" class="p-5 space-y-4">
          <label class="block text-sm font-medium text-slate-700">Valor (R$)
            <input class="mx-field mt-1" type="number" step="0.01" min="0.01" name="amount" [(ngModel)]="d.amount" required></label>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="deposit.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  }
</main>`,
})
export class MixcoGoalsComponent implements OnInit {
  mixco = inject(MixcoService);
  form = signal<Partial<MxGoal> | null>(null);
  deposit = signal<{ goal: MxGoal; amount: number | null } | null>(null);

  ngOnInit() { void this.mixco.loadAll(); }

  /** 6 meses da despesa média: referência da reserva de emergência. */
  reserveTarget(): number {
    return Math.round((this.mixco.summary()?.emergencyFund.avgMonthlyExpense ?? 0) * 6);
  }

  pct(g: MxGoal): number { return Math.min(100, (g.savedAmount / g.targetAmount) * 100); }

  private monthsLeft(g: MxGoal): number {
    const d = new Date(g.deadline + 'T00:00:00');
    const now = new Date();
    return (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth() + (d.getDate() >= now.getDate() ? 1 : 0);
  }
  monthly(g: MxGoal): number {
    const left = g.targetAmount - g.savedAmount;
    const m = this.monthsLeft(g);
    return left <= 0 || m <= 0 ? 0 : Math.ceil((left / m) * 100) / 100;
  }
  late(g: MxGoal): boolean { return g.savedAmount < g.targetAmount && this.monthsLeft(g) <= 0; }
  plan(g: MxGoal): string {
    if (g.savedAmount >= g.targetAmount) return 'Meta atingida.';
    if (this.late(g)) return 'Prazo vencido: ajuste o prazo ou o valor.';
    const m = this.monthly(g);
    return `Guarde ${m.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês durante ${this.monthsLeft(g)} mês(es).`;
  }

  private inMonths(n: number): string {
    const d = new Date(); d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }
  newGoal() { this.form.set({ savedAmount: 0, deadline: this.inMonths(12) }); }
  newReserve() {
    this.form.set({ name: 'Reserva de emergência (6 meses)', targetAmount: this.reserveTarget(),
      savedAmount: Math.min(this.mixco.summary()?.emergencyFund.liquid ?? 0, this.reserveTarget()), deadline: this.inMonths(12) });
  }
  edit(g: MxGoal) { this.form.set({ ...g }); }

  async save() {
    const f = this.form();
    if (!f?.name || !(Number(f.targetAmount) > 0) || !f.deadline) return;
    const ok = await this.mixco.save('goals', {
      id: f.id, name: f.name, targetAmount: Number(f.targetAmount), savedAmount: Number(f.savedAmount) || 0, deadline: f.deadline,
    }, 'Meta salva.');
    if (ok) this.form.set(null);
  }

  async saveDeposit() {
    const d = this.deposit();
    if (!d || !(Number(d.amount) > 0)) return;
    const g = d.goal;
    const ok = await this.mixco.save('goals', { ...g, savedAmount: g.savedAmount + Number(d.amount) }, 'Aporte registrado.');
    if (ok) this.deposit.set(null);
  }
}
