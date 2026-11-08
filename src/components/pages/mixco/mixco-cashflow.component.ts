import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import { MixcoService } from '../../../services/mixco.service';
import { ACCOUNT_KIND_LABELS, BUDGET_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, INTERNAL_CATEGORIES, MxAccount, MxRecurring, MxTransaction } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';
import { colorOfCategory } from './mx-visuals';

const today = () => new Date().toISOString().slice(0, 10);

/** Contas, lançamentos do mês e orçamento por categoria. */
@Component({
  selector: 'app-mixco-cashflow',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="mx-page p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
  <div class="flex items-end justify-between gap-3 mb-4 mx-rise">
    <div class="min-w-0">
      <h1 class="mx-title">Fluxo de caixa</h1>
      <p class="mx-subtitle hidden sm:block">Contas, entradas e saídas do mês, e quanto você quer gastar por categoria.</p>
    </div>
    <div class="flex items-center rounded-2xl bg-white ring-1 ring-slate-200 shrink-0" role="group" aria-label="Mês">
      <button type="button" class="w-11 h-11 flex items-center justify-center text-slate-500 active:bg-slate-100 rounded-l-2xl" (click)="shiftMonth(-1)" aria-label="Mês anterior">
        <lucide-icon [img]="icons.prev" [size]="18"></lucide-icon>
      </button>
      <span class="px-1 min-w-[6.5rem] text-center text-sm font-semibold capitalize text-slate-800">{{ monthLabel() }}</span>
      <button type="button" class="w-11 h-11 flex items-center justify-center text-slate-500 active:bg-slate-100 rounded-r-2xl disabled:opacity-30" [disabled]="isCurrentMonth()" (click)="shiftMonth(1)" aria-label="Próximo mês">
        <lucide-icon [img]="icons.next" [size]="18"></lucide-icon>
      </button>
    </div>
  </div>

  <!-- Abas (celular): uma coisa por vez em vez de uma rolagem de 3 telas -->
  <div class="lg:hidden sticky top-14 z-10 -mx-4 px-4 py-2 mb-4 bg-[#f5f6f8]/90 backdrop-blur mx-scroll-x flex gap-2" role="tablist">
    @for (t of tabs; track t.id) {
      <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
              class="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition"
              [class]="tab() === t.id ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-600 ring-slate-200'">{{ t.label }}</button>
    }
  </div>

  <!-- Contas -->
  <section class="mb-6" [class]="show('contas')">
    <div class="flex items-center justify-between mb-3">
      <h2 class="mx-section-title">Contas e cartões</h2>
      <button type="button" class="btn-secondary" (click)="newAccount()">Nova conta</button>
    </div>
    <div class="mx-scroll-x flex snap-x snap-mandatory scroll-px-4 gap-3 -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 sm:overflow-visible">
      @for (a of mixco.accounts(); track a.id) {
        <div class="relative overflow-hidden rounded-2xl p-5 mx-rise transition snap-center shrink-0 w-[82%] sm:w-auto hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
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
  <section class="mx-card mb-6 mx-rise" [class]="show('lanc')">
    <div class="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-100">
      <div>
        <h2 class="mx-section-title">Lançamentos</h2>
        <p class="text-xs text-slate-500 tabular">+{{ totals().income | brl }} · −{{ totals().expense | brl }} · <b [class.text-[var(--color-loss)]]="totals().income < totals().expense" class="text-slate-700">saldo {{ totals().income - totals().expense | brl }}</b></p>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition"
                [class]="onlyUncategorized() ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-600 ring-slate-200'"
                (click)="onlyUncategorized.set(!onlyUncategorized())">Sem categoria ({{ mixco.summary()?.uncategorized ?? 0 }})</button>
        <button type="button" class="btn-primary hidden sm:inline-flex" [disabled]="!mixco.accounts().length" (click)="newTx()">Adicionar</button>
      </div>
    </div>
    @for (t of visibleTxs(); track t.id) {
      <div class="mx-row cursor-pointer active:bg-slate-100" [class.opacity-60]="isInternal(t.category)" (click)="editTx(t)" role="button" tabindex="0" (keydown.enter)="editTx(t)">
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
        <div class="text-sm whitespace-nowrap hidden sm:flex" (click)="$event.stopPropagation()">
          <button type="button" class="btn-link" (click)="editTx(t)">Editar</button>
          <button type="button" class="btn-link-danger" (click)="deleteTx(t)">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhum lançamento neste mês.</p>
    }
  </section>

  <!-- Contas fixas -->
  <section class="mx-card mb-6 mx-rise" [class]="show('fixas')">
    <div class="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
      <div>
        <h2 class="mx-section-title">Contas fixas</h2>
        <p class="text-xs text-slate-500">Aluguel, assinaturas, parcelas. O MiXCo marca como paga quando acha um lançamento com a mesma descrição.</p>
      </div>
      <button type="button" class="btn-secondary" (click)="newRecurring()">Nova conta fixa</button>
    </div>
    @for (r of mixco.recurring(); track r.id) {
      <div class="mx-row">
        <span class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold shrink-0">{{ r.dayOfMonth }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-900 truncate">{{ r.description }}</p>
          <p class="text-xs text-slate-500">Todo dia {{ r.dayOfMonth }} · {{ r.category }}</p>
        </div>
        <p class="font-semibold tabular" [class.text-[var(--color-gain)]]="r.type === 'income'">{{ r.type === 'income' ? '+' : '' }}{{ r.amount | brl }}</p>
        <button type="button" class="btn-link" (click)="editRecurring(r)">Editar</button>
        <button type="button" class="btn-link-danger" (click)="mixco.remove('recurring', r.id, 'Conta fixa removida.')">Excluir</button>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhuma conta fixa. Cadastre as principais para ver a projeção do mês.</p>
    }
  </section>

  @if (recurringForm(); as f) {
    <div class="mx-backdrop" (click)="recurringForm.set(null)">
      <div class="mx-modal max-w-md" (click)="$event.stopPropagation()">
        <h3 class="mx-modal-title">{{ f.id ? 'Editar conta fixa' : 'Nova conta fixa' }}</h3>
        <form (ngSubmit)="saveRecurring()" class="p-6 space-y-4">
          <label class="block text-[13px] font-medium text-slate-600">Descrição
            <input class="mx-field mt-1" name="rd" [(ngModel)]="f.description" required placeholder="Ex: Aluguel"></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-[13px] font-medium text-slate-600">Valor (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0.01" name="ra" [(ngModel)]="f.amount" required></label>
            <label class="block text-[13px] font-medium text-slate-600">Dia do vencimento
              <input class="mx-field mt-1" type="number" min="1" max="31" name="rday" [(ngModel)]="f.dayOfMonth" required></label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-[13px] font-medium text-slate-600">Tipo
              <select class="mx-field mt-1" name="rt" [(ngModel)]="f.type"><option value="expense">Despesa</option><option value="income">Receita</option></select></label>
            <label class="block text-[13px] font-medium text-slate-600">Categoria
              <select class="mx-field mt-1" name="rc2" [(ngModel)]="f.category">
                @for (c of (f.type === 'income' ? incomeCategories : budgetCategories); track c) { <option [value]="c">{{ c }}</option> }
              </select></label>
          </div>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="recurringForm.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Orçamento -->
  <section class="mx-card mx-rise" [class]="show('orc')">
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
  <section class="mx-card mt-6 mx-rise" [class]="show('orc')">
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
          <div class="pt-2 flex flex-wrap justify-end gap-3">
            @if (f.id) { <button type="button" class="btn-link-danger mr-auto" (click)="deleteTxFromForm()">Excluir</button> }
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
  readonly icons = { prev: ChevronLeft, next: ChevronRight };
  tabs = [
    { id: 'lanc', label: 'Lançamentos' }, { id: 'contas', label: 'Contas' },
    { id: 'fixas', label: 'Contas fixas' }, { id: 'orc', label: 'Orçamento' },
  ] as const;
  tab = signal<'lanc' | 'contas' | 'fixas' | 'orc'>('lanc');
  /** Celular mostra só a aba ativa; telas grandes (lg+) mostram tudo. */
  show(id: string): string { return this.tab() === id ? '' : 'max-lg:hidden'; }

  monthLabel = computed(() => {
    const [y, m] = this.mixco.month().split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ').replace('.', '');
  });
  isCurrentMonth = computed(() => {
    const d = new Date();
    return this.mixco.month() >= `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  shiftMonth(delta: number) {
    const [y, m] = this.mixco.month().split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    void this.mixco.setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  deleteTxFromForm() {
    const id = this.txForm()?.id;
    if (!id) return;
    void this.mixco.remove('transactions', id, 'Lançamento excluído.').then(ok => ok && this.txForm.set(null));
  }

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

  recurringForm = signal<Partial<MxRecurring> | null>(null);
  newRecurring() { this.recurringForm.set({ type: 'expense', category: BUDGET_CATEGORIES[0], dayOfMonth: 5 }); }
  editRecurring(r: MxRecurring) { this.recurringForm.set({ ...r }); }
  async saveRecurring() {
    const f = this.recurringForm();
    if (!f?.description || !(Number(f.amount) > 0) || !(Number(f.dayOfMonth) >= 1)) return;
    const ok = await this.mixco.save('recurring', {
      id: f.id, description: f.description, type: f.type, amount: Number(f.amount), dayOfMonth: Math.round(Number(f.dayOfMonth)), category: f.category,
    }, 'Conta fixa salva.');
    if (ok) this.recurringForm.set(null);
  }

  async addRule() {
    if (!this.ruleKeyword.trim()) return;
    if (await this.mixco.save('rules', { keyword: this.ruleKeyword.trim(), category: this.ruleCategory }, 'Regra criada.')) this.ruleKeyword = '';
  }

  async addBudget() {
    if (!(Number(this.budgetLimit) > 0)) return;
    if (await this.mixco.setBudget(this.budgetCategory, Number(this.budgetLimit))) this.budgetLimit = null;
  }
}
