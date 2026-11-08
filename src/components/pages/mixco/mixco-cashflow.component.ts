import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { ACCOUNT_KIND_LABELS, BUDGET_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, INTERNAL_CATEGORIES, MxAccount, MxTransaction } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';
import { colorOfCategory } from './mx-visuals';

const today = () => new Date().toISOString().slice(0, 10);

/** Contas, lançamentos do mês e orçamento por categoria. */
@Component({
  selector: 'app-mixco-cashflow',
  standalone: true,
  imports: [FormsModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
  <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 mx-rise">
    <div>
      <h1 class="mx-title">Fluxo de caixa</h1>
      <p class="mx-subtitle">Contas, entradas e saídas do mês, e quanto você quer gastar por categoria.</p>
    </div>
    <input type="month" class="mx-field sm:w-44" [ngModel]="mixco.month()" (ngModelChange)="changeMonth($event)" aria-label="Mês">
  </div>

  <!-- Contas -->
  <section class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="mx-section-title">Contas e cartões</h2>
      <button type="button" class="btn-secondary" (click)="newAccount()">Nova conta</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      @for (a of mixco.accounts(); track a.id) {
        <div class="relative overflow-hidden rounded-2xl p-5 mx-rise transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
             [class]="a.kind === 'credit' ? 'text-white bg-gradient-to-br from-ink-800 to-ink-700 shadow-[var(--shadow-card)]' : 'mx-card'">
          @if (a.kind === 'credit') { <span class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-mint-400/20 blur-2xl"></span> }
          <div class="relative flex items-start justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider" [class]="a.kind === 'credit' ? 'text-white/50' : 'text-slate-400'">{{ kindLabel(a.kind) }}{{ a.institution ? ' · ' + a.institution : '' }}</p>
              <p class="font-semibold mt-1" [class]="a.kind === 'credit' ? 'text-white' : 'text-slate-900'">{{ a.name }}</p>
            </div>
            @if (a.source === 'pluggy') { <span class="mx-chip !bg-mint-400/15 !text-emerald-700" [class.!text-mint-300]="a.kind === 'credit'">Pluggy</span> }
          </div>
          <p class="relative text-2xl font-semibold tracking-tight tabular mt-4" [class.text-rose-300]="a.kind === 'credit' && a.balance < 0" [class.text-[var(--color-loss)]]="a.kind !== 'credit' && a.balance < 0">{{ a.balance | brl }}</p>
          @if (a.kind === 'credit') { <p class="relative text-xs text-white/50 mt-0.5">Fatura em aberto</p> }
          @if (a.source !== 'pluggy') {
            <div class="relative mt-3 text-sm flex gap-1">
              <button type="button" class="btn-link" [class.!text-white/60]="a.kind === 'credit'" (click)="editAccount(a)">Editar</button>
              <button type="button" class="btn-link-danger" [class.!text-white/60]="a.kind === 'credit'" (click)="deleteAccount(a)">Excluir</button>
            </div>
          }
        </div>
      } @empty {
        <p class="text-sm text-slate-500 col-span-full">Cadastre ao menos uma conta para registrar lançamentos.</p>
      }
    </div>
  </section>

  <!-- Lançamentos do mês -->
  <section class="mx-card mb-6 mx-rise">
    <div class="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-100">
      <div>
        <h2 class="mx-section-title">Lançamentos</h2>
        <p class="text-xs text-slate-500 tabular">Entradas {{ totals().income | brl }} · Saídas {{ totals().expense | brl }}</p>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-sm text-slate-600 flex items-center gap-2"><input type="checkbox" [checked]="onlyUncategorized()" (change)="onlyUncategorized.set(!onlyUncategorized())"> Só sem categoria ({{ mixco.summary()?.uncategorized ?? 0 }})</label>
        <button type="button" class="btn-primary" [disabled]="!mixco.accounts().length" (click)="newTx()">Adicionar</button>
      </div>
    </div>
    @for (t of visibleTxs(); track t.id) {
      <div class="mx-row" [class.opacity-60]="isInternal(t.category)">
        <span class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" [style.background]="catColor(t.category)">{{ t.category.charAt(0) }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-900 truncate">{{ t.description }}</p>
          <p class="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{{ t.date.slice(8) }}/{{ t.date.slice(5, 7) }}</span>
            <span class="mx-chip">{{ t.category }}</span>
            @if (isInternal(t.category)) { <span class="text-slate-400">fora do fluxo</span> }
            <span class="hidden sm:inline text-slate-400">{{ accountName(t.accountId) }}</span>
          </p>
        </div>
        <p class="font-semibold tabular text-right" [class.text-[var(--color-gain)]]="t.type === 'income'" [class.text-slate-900]="t.type === 'expense'">
          {{ t.type === 'income' ? '+' : '−' }} {{ t.amount | brl }}
        </p>
        <div class="text-sm whitespace-nowrap hidden sm:flex">
          <button type="button" class="btn-link" (click)="editTx(t)">Editar</button>
          <button type="button" class="btn-link-danger" (click)="deleteTx(t)">Excluir</button>
        </div>
        <button type="button" class="sm:hidden btn-link" (click)="editTx(t)" aria-label="Editar lançamento">Editar</button>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhum lançamento neste mês.</p>
    }
  </section>

  <!-- Orçamento -->
  <section class="mx-card mx-rise">
    <div class="px-4 sm:px-5 py-4 border-b border-slate-100">
      <h2 class="mx-section-title">Orçamento mensal</h2>
      <p class="text-xs text-slate-500">Limite de gasto por categoria. O painel avisa quando você passa.</p>
    </div>
    @for (b of mixco.budgets(); track b.category) {
      <div class="mx-row">
        <p class="flex-1 text-slate-800">{{ b.category }}</p>
        <p class="font-medium tabular">{{ b.monthlyLimit | brl }}</p>
        <button type="button" class="btn-link-danger" (click)="mixco.removeBudget(b.category)">Remover</button>
      </div>
    }
    <form class="p-4 flex flex-col sm:flex-row gap-3" (ngSubmit)="addBudget()">
      <select class="mx-field sm:flex-1" name="cat" [(ngModel)]="budgetCategory">
        @for (c of budgetCategories; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <input class="mx-field sm:w-40" type="number" min="1" step="0.01" name="lim" [(ngModel)]="budgetLimit" placeholder="Limite (R$)" required>
      <button type="submit" class="btn-primary">Definir limite</button>
    </form>
  </section>

  <!-- Regras de categoria -->
  <section class="mx-card mt-6 mx-rise">
    <div class="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="mx-section-title">Regras de categoria</h2>
        <p class="text-xs text-slate-500">Se a descrição contém a palavra, o lançamento recebe a categoria (valem para novas importações).</p>
      </div>
      <button type="button" class="btn-secondary" (click)="mixco.applyRules()">Aplicar aos sem categoria</button>
    </div>
    @for (r of mixco.rules(); track r.id) {
      <div class="mx-row !py-2.5">
        <p class="flex-1 text-sm text-slate-800">"{{ r.keyword }}" → <b>{{ r.category }}</b></p>
        <button type="button" class="btn-link-danger" (click)="mixco.remove('rules', r.id, 'Regra removida.')">Remover</button>
      </div>
    }
    <form class="p-4 flex flex-col sm:flex-row gap-3" (ngSubmit)="addRule()">
      <input class="mx-field sm:flex-1" name="kw" [(ngModel)]="ruleKeyword" placeholder='Palavra na descrição (ex: "uber")' required>
      <select class="mx-field sm:w-52" name="rc" [(ngModel)]="ruleCategory">
        @for (c of expenseCategories; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <button type="submit" class="btn-primary">Criar regra</button>
    </form>
  </section>

  <!-- Formulário de conta -->
  @if (accountForm(); as f) {
    <div class="mx-backdrop" (click)="accountForm.set(null)">
      <div class="mx-modal max-w-md" (click)="$event.stopPropagation()">
        <h3 class="mx-modal-title">{{ f.id ? 'Editar conta' : 'Nova conta' }}</h3>
        <form (ngSubmit)="saveAccount()" class="p-5 space-y-4">
          <label class="block text-[13px] font-medium text-slate-600">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Conta principal"></label>
          <label class="block text-[13px] font-medium text-slate-600">Tipo
            <select class="mx-field mt-1" name="kind" [(ngModel)]="f.kind">
              @for (k of accountKinds; track k[0]) { <option [value]="k[0]">{{ k[1] }}</option> }
            </select></label>
          <label class="block text-[13px] font-medium text-slate-600">Instituição (opcional)
            <input class="mx-field mt-1" name="institution" [(ngModel)]="f.institution"></label>
          <label class="block text-[13px] font-medium text-slate-600">Saldo inicial (R$)
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
    <div class="mx-backdrop" (click)="txForm.set(null)">
      <div class="mx-modal max-w-md" (click)="$event.stopPropagation()">
        <h3 class="mx-modal-title">{{ f.id ? 'Editar lançamento' : 'Novo lançamento' }}</h3>
        <form (ngSubmit)="saveTx()" class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary" [class.!bg-emerald-600]="f.type === 'expense'" [class.!text-white]="f.type === 'expense'" (click)="setTxType('expense')">Saída</button>
            <button type="button" class="btn-secondary" [class.!bg-emerald-600]="f.type === 'income'" [class.!text-white]="f.type === 'income'" (click)="setTxType('income')">Entrada</button>
          </div>
          <label class="block text-[13px] font-medium text-slate-600">Descrição
            <input class="mx-field mt-1" name="description" [(ngModel)]="f.description" required></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-[13px] font-medium text-slate-600">Valor (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0.01" name="amount" [(ngModel)]="f.amount" required></label>
            <label class="block text-[13px] font-medium text-slate-600">Data
              <input class="mx-field mt-1" type="date" name="date" [(ngModel)]="f.date" required></label>
          </div>
          <label class="block text-[13px] font-medium text-slate-600">Categoria
            <select class="mx-field mt-1" name="category" [(ngModel)]="f.category">
              @for (c of f.type === 'income' ? incomeCategories : expenseCategories; track c) { <option [value]="c">{{ c }}</option> }
            </select></label>
          <label class="block text-[13px] font-medium text-slate-600">Conta
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
  budgetCategories = BUDGET_CATEGORIES;
  incomeCategories = INCOME_CATEGORIES;

  accountForm = signal<Partial<MxAccount> | null>(null);
  txForm = signal<Partial<MxTransaction> | null>(null);
  budgetCategory = BUDGET_CATEGORIES[0];
  onlyUncategorized = signal(false);
  ruleKeyword = '';
  ruleCategory = BUDGET_CATEGORIES[0];
  visibleTxs = computed(() => this.mixco.transactions().filter(t => !this.onlyUncategorized() || t.category === 'Outros'));
  catColor = colorOfCategory;
  isInternal(c: string) { return INTERNAL_CATEGORIES.includes(c); }
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

  async addRule() {
    if (!this.ruleKeyword.trim()) return;
    if (await this.mixco.save('rules', { keyword: this.ruleKeyword.trim(), category: this.ruleCategory }, 'Regra criada.')) this.ruleKeyword = '';
  }

  async addBudget() {
    if (!(Number(this.budgetLimit) > 0)) return;
    if (await this.mixco.setBudget(this.budgetCategory, Number(this.budgetLimit))) this.budgetLimit = null;
  }
}
