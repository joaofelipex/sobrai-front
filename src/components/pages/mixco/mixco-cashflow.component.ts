import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { ACCOUNT_KIND_LABELS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, MxAccount, MxTransaction } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';

const today = () => new Date().toISOString().slice(0, 10);

/** Contas, lançamentos do mês e orçamento por categoria. */
@Component({
  selector: 'app-mixco-cashflow',
  standalone: true,
  imports: [FormsModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Fluxo de caixa</h1>
      <p class="text-sm text-slate-500 mt-0.5">Contas, entradas e saídas do mês, e quanto você quer gastar por categoria.</p>
    </div>
    <input type="month" class="mx-field sm:w-44" [ngModel]="mixco.month()" (ngModelChange)="changeMonth($event)" aria-label="Mês">
  </div>

  <!-- Contas -->
  <section class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-semibold text-slate-800">Contas</h2>
      <button type="button" class="btn-secondary" (click)="newAccount()">Nova conta</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      @for (a of mixco.accounts(); track a.id) {
        <div class="bg-white border border-slate-200/80 rounded-lg p-4">
          <p class="text-xs text-slate-500">{{ kindLabel(a.kind) }}{{ a.institution ? ' · ' + a.institution : '' }}</p>
          <p class="font-medium text-slate-800">{{ a.name }}</p>
          <p class="text-xl font-semibold tabular mt-1" [class.text-red-700]="a.balance < 0">{{ a.balance | brl }}</p>
          <div class="mt-2 text-sm space-x-3">
            <button type="button" class="text-slate-600 hover:text-emerald-700" (click)="editAccount(a)">Editar</button>
            <button type="button" class="text-slate-600 hover:text-red-700" (click)="deleteAccount(a)">Excluir</button>
          </div>
        </div>
      } @empty {
        <p class="text-sm text-slate-500 col-span-full">Cadastre ao menos uma conta para registrar lançamentos.</p>
      }
    </div>
  </section>

  <!-- Lançamentos do mês -->
  <section class="bg-white border border-slate-200/80 rounded-lg mb-6">
    <div class="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-slate-200/80">
      <div>
        <h2 class="font-semibold text-slate-800">Lançamentos</h2>
        <p class="text-xs text-slate-500 tabular">Entradas {{ totals().income | brl }} · Saídas {{ totals().expense | brl }}</p>
      </div>
      <button type="button" class="btn-primary" [disabled]="!mixco.accounts().length" (click)="newTx()">Adicionar</button>
    </div>
    @for (t of mixco.transactions(); track t.id) {
      <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-800 truncate">{{ t.description }}</p>
          <p class="text-xs text-slate-500">{{ t.date.slice(8) }}/{{ t.date.slice(5, 7) }} · {{ t.category }} · {{ accountName(t.accountId) }}</p>
        </div>
        <p class="font-medium tabular" [class.text-success-700]="t.type === 'income'" [class.text-red-700]="t.type === 'expense'">
          {{ t.type === 'income' ? '+' : '−' }} {{ t.amount | brl }}
        </p>
        <div class="text-sm space-x-3 whitespace-nowrap">
          <button type="button" class="text-slate-600 hover:text-emerald-700" (click)="editTx(t)">Editar</button>
          <button type="button" class="text-slate-600 hover:text-red-700" (click)="deleteTx(t)">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhum lançamento neste mês.</p>
    }
  </section>

  <!-- Orçamento -->
  <section class="bg-white border border-slate-200/80 rounded-lg">
    <div class="p-4 border-b border-slate-200/80">
      <h2 class="font-semibold text-slate-800">Orçamento mensal</h2>
      <p class="text-xs text-slate-500">Limite de gasto por categoria. O painel avisa quando você passa.</p>
    </div>
    @for (b of mixco.budgets(); track b.category) {
      <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <p class="flex-1 text-slate-800">{{ b.category }}</p>
        <p class="font-medium tabular">{{ b.monthlyLimit | brl }}</p>
        <button type="button" class="text-sm text-slate-600 hover:text-red-700" (click)="mixco.removeBudget(b.category)">Remover</button>
      </div>
    }
    <form class="p-4 flex flex-col sm:flex-row gap-3" (ngSubmit)="addBudget()">
      <select class="mx-field sm:flex-1" name="cat" [(ngModel)]="budgetCategory">
        @for (c of expenseCategories; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <input class="mx-field sm:w-40" type="number" min="1" step="0.01" name="lim" [(ngModel)]="budgetLimit" placeholder="Limite (R$)" required>
      <button type="submit" class="btn-primary">Definir limite</button>
    </form>
  </section>

  <!-- Formulário de conta -->
  @if (accountForm(); as f) {
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="accountForm.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-md" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">{{ f.id ? 'Editar conta' : 'Nova conta' }}</h3>
        <form (ngSubmit)="saveAccount()" class="p-5 space-y-4">
          <label class="block text-sm font-medium text-slate-700">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Conta principal"></label>
          <label class="block text-sm font-medium text-slate-700">Tipo
            <select class="mx-field mt-1" name="kind" [(ngModel)]="f.kind">
              @for (k of accountKinds; track k[0]) { <option [value]="k[0]">{{ k[1] }}</option> }
            </select></label>
          <label class="block text-sm font-medium text-slate-700">Instituição (opcional)
            <input class="mx-field mt-1" name="institution" [(ngModel)]="f.institution"></label>
          <label class="block text-sm font-medium text-slate-700">Saldo inicial (R$)
            <input class="mx-field mt-1" type="number" step="0.01" name="initialBalance" [(ngModel)]="f.initialBalance"></label>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="accountForm.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Formulário de lançamento -->
  @if (txForm(); as f) {
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="txForm.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">{{ f.id ? 'Editar lançamento' : 'Novo lançamento' }}</h3>
        <form (ngSubmit)="saveTx()" class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary" [class.!bg-emerald-600]="f.type === 'expense'" [class.!text-white]="f.type === 'expense'" (click)="setTxType('expense')">Saída</button>
            <button type="button" class="btn-secondary" [class.!bg-emerald-600]="f.type === 'income'" [class.!text-white]="f.type === 'income'" (click)="setTxType('income')">Entrada</button>
          </div>
          <label class="block text-sm font-medium text-slate-700">Descrição
            <input class="mx-field mt-1" name="description" [(ngModel)]="f.description" required></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium text-slate-700">Valor (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0.01" name="amount" [(ngModel)]="f.amount" required></label>
            <label class="block text-sm font-medium text-slate-700">Data
              <input class="mx-field mt-1" type="date" name="date" [(ngModel)]="f.date" required></label>
          </div>
          <label class="block text-sm font-medium text-slate-700">Categoria
            <select class="mx-field mt-1" name="category" [(ngModel)]="f.category">
              @for (c of f.type === 'income' ? incomeCategories : expenseCategories; track c) { <option [value]="c">{{ c }}</option> }
            </select></label>
          <label class="block text-sm font-medium text-slate-700">Conta
            <select class="mx-field mt-1" name="accountId" [(ngModel)]="f.accountId">
              @for (a of mixco.accounts(); track a.id) { <option [value]="a.id">{{ a.name }}</option> }
            </select></label>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="txForm.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }
</main>`,
})
export class MixcoCashflowComponent implements OnInit {
  mixco = inject(MixcoService);

  accountKinds = Object.entries(ACCOUNT_KIND_LABELS);
  expenseCategories = EXPENSE_CATEGORIES;
  incomeCategories = INCOME_CATEGORIES;

  accountForm = signal<Partial<MxAccount> | null>(null);
  txForm = signal<Partial<MxTransaction> | null>(null);
  budgetCategory = EXPENSE_CATEGORIES[0];
  budgetLimit: number | null = null;

  totals = computed(() => {
    let income = 0, expense = 0;
    for (const t of this.mixco.transactions()) {
      if (t.type === 'income') income += t.amount; else expense += t.amount;
    }
    return { income, expense };
  });

  ngOnInit() { void this.mixco.loadAll(); }

  kindLabel(k: string) { return (ACCOUNT_KIND_LABELS as Record<string, string>)[k] ?? k; }
  accountName(id: string) { return this.mixco.accounts().find(a => a.id === id)?.name ?? '—'; }

  changeMonth(m: string) { if (m) void this.mixco.setMonth(m); }

  newAccount() { this.accountForm.set({ kind: 'checking', initialBalance: 0 }); }
  editAccount(a: MxAccount) { this.accountForm.set({ ...a }); }
  async saveAccount() {
    const f = this.accountForm();
    if (!f?.name) return;
    const ok = await this.mixco.save('accounts', {
      id: f.id, name: f.name, kind: f.kind, institution: f.institution || undefined, initialBalance: Number(f.initialBalance) || 0,
    }, 'Conta salva.');
    if (ok) this.accountForm.set(null);
  }
  deleteAccount(a: MxAccount) { void this.mixco.remove('accounts', a.id, 'Conta excluída.'); }

  newTx() {
    this.txForm.set({
      type: 'expense', category: EXPENSE_CATEGORIES[0], accountId: this.mixco.accounts()[0]?.id,
      date: today().slice(0, 7) === this.mixco.month() ? today() : `${this.mixco.month()}-01`,
    });
  }
  editTx(t: MxTransaction) { this.txForm.set({ ...t }); }
  setTxType(type: 'income' | 'expense') {
    this.txForm.update(f => f && ({ ...f, type, category: (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));
  }
  async saveTx() {
    const f = this.txForm();
    if (!f?.description || !f.accountId || !(Number(f.amount) > 0) || !f.date) return;
    const ok = await this.mixco.save('transactions', {
      id: f.id, accountId: f.accountId, type: f.type, description: f.description,
      amount: Number(f.amount), date: f.date, category: f.category,
    }, 'Lançamento salvo.');
    if (ok) this.txForm.set(null);
  }
  deleteTx(t: MxTransaction) { void this.mixco.remove('transactions', t.id, 'Lançamento excluído.'); }

  async addBudget() {
    if (!(Number(this.budgetLimit) > 0)) return;
    if (await this.mixco.setBudget(this.budgetCategory, Number(this.budgetLimit))) this.budgetLimit = null;
  }
}
