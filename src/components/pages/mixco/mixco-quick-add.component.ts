import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { LucideAngularModule, Plus, X } from 'lucide-angular';
import { MixcoService } from '../../../services/mixco.service';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, INTERNAL_CATEGORIES } from '../../../models/mixco.model';
import { colorOfCategory } from './mx-visuals';

/**
 * Lançamento rápido, pensado para uma mão só: valor grande primeiro, categoria em um toque.
 * O botão "+" flutua acima da barra inferior nas telas do MiXCo.
 */
@Component({
  selector: 'mx-quick-add',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
@if (visible() && !mixco.quickAddOpen()) {
  <button type="button" (click)="open()" aria-label="Novo lançamento"
          class="fixed z-30 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-8 w-14 h-14 rounded-2xl text-white
                 bg-gradient-to-br from-mint-500 to-emerald-600 shadow-[0_12px_28px_-8px_rgb(31_191_159_/_0.7)] flex items-center justify-center
                 active:scale-90 hover:brightness-110 transition">
    <lucide-icon [img]="icons.plus" [size]="26" [strokeWidth]="2.4"></lucide-icon>
  </button>
}

@if (mixco.quickAddOpen()) {
  <div class="mx-backdrop" (click)="close()">
    <div class="mx-modal max-w-md" (click)="$event.stopPropagation()" role="dialog" aria-label="Novo lançamento">
      @if (!mixco.accounts().length) {
        <div class="p-6 text-center">
          <h3 class="text-lg font-semibold text-slate-900">Crie uma conta primeiro</h3>
          <p class="mt-2 text-sm text-slate-500">Os lançamentos ficam dentro de uma conta (ex: Nubank, Dinheiro).</p>
          <a routerLink="/mixco/fluxo" (click)="close()" class="btn-primary mt-5">Ir para contas</a>
        </div>
      } @else {
        <form (ngSubmit)="save()" class="p-5 pt-6 space-y-5">
          <div class="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100">
            <button type="button" class="py-2 rounded-xl text-sm font-semibold transition" [class]="type() === 'expense' ? 'bg-white shadow text-slate-900' : 'text-slate-500'" (click)="setType('expense')">Saída</button>
            <button type="button" class="py-2 rounded-xl text-sm font-semibold transition" [class]="type() === 'income' ? 'bg-white shadow text-[var(--color-gain)]' : 'text-slate-500'" (click)="setType('income')">Entrada</button>
          </div>

          <label class="block text-center">
            <span class="mx-label">Valor</span>
            <span class="flex items-baseline justify-center gap-2 mt-1">
              <span class="text-2xl font-semibold text-slate-400">R$</span>
              <input class="mx-amount w-44 bg-transparent text-center font-semibold tracking-tight tabular text-slate-900 outline-none placeholder:text-slate-300"
                     type="number" inputmode="decimal" step="0.01" min="0.01" name="amount" placeholder="0,00" [(ngModel)]="amount" autofocus required>
            </span>
          </label>

          <div>
            <span class="mx-label">Categoria</span>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (c of categories(); track c) {
                <button type="button" (click)="category.set(c)"
                        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset transition"
                        [class]="category() === c ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-600 ring-slate-200'">
                  <span class="w-2 h-2 rounded-full" [style.background]="color(c)"></span>{{ c }}
                </button>
              }
            </div>
          </div>

          <input class="mx-field" name="description" [(ngModel)]="description" placeholder="Descrição (opcional)">
          <div class="grid grid-cols-2 gap-3">
            <select class="mx-field" name="account" [(ngModel)]="accountId" aria-label="Conta">
              @for (a of mixco.accounts(); track a.id) { <option [value]="a.id">{{ a.name }}</option> }
            </select>
            <input class="mx-field" type="date" name="date" [(ngModel)]="date" aria-label="Data" required>
          </div>

          <div class="flex gap-3 pb-[env(safe-area-inset-bottom)]">
            <button type="button" class="btn-secondary flex-1" (click)="close()">Cancelar</button>
            <button type="submit" class="btn-primary flex-[2]" [disabled]="!(amount && amount > 0)">Salvar lançamento</button>
          </div>
        </form>
      }
    </div>
  </div>
}`,
})
export class MixcoQuickAddComponent {
  mixco = inject(MixcoService);
  private router = inject(Router);
  readonly icons = { plus: Plus, x: X };
  color = colorOfCategory;

  private url = toSignal(this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), map(e => e.urlAfterRedirects)), { initialValue: this.router.url });
  visible = computed(() => this.url().startsWith('/mixco'));

  type = signal<'expense' | 'income'>('expense');
  category = signal('Alimentação');
  categories = computed(() => (this.type() === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).filter(c => !INTERNAL_CATEGORIES.includes(c)));
  amount: number | null = null;
  description = '';
  accountId = '';
  date = '';

  constructor() {
    effect(() => { if (this.mixco.quickAddOpen()) void this.prepare(); });
  }

  private async prepare() {
    if (!this.mixco.accounts().length) await this.mixco.loadAll();
    this.amount = null; this.description = ''; this.type.set('expense'); this.category.set('Alimentação');
    this.accountId = this.accountId && this.mixco.accounts().some(a => a.id === this.accountId) ? this.accountId : (this.mixco.accounts().find(a => a.kind !== 'credit') ?? this.mixco.accounts()[0])?.id ?? '';
    const d = new Date();
    this.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  open() { this.mixco.quickAddOpen.set(true); }
  close() { this.mixco.quickAddOpen.set(false); }
  setType(t: 'expense' | 'income') { this.type.set(t); this.category.set(this.categories()[0]); }

  async save() {
    if (!(Number(this.amount) > 0) || !this.accountId) return;
    const ok = await this.mixco.save('transactions', {
      accountId: this.accountId, type: this.type(), amount: Number(this.amount), date: this.date, category: this.category(),
      description: this.description.trim() || this.category(),
    }, 'Lançamento salvo.');
    if (ok) this.close();
  }
}
