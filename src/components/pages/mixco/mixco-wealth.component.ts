import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { ASSET_CLASS_LABELS, LIABILITY_KIND_LABELS, MxAsset, MxLiability } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';
import { colorOfClass } from './mx-visuals';

type Target = { kind: 'asset' | 'liability'; id: string; name: string };

/** Bens, investimentos e dívidas: o que você tem e o que você deve. */
@Component({
  selector: 'app-mixco-wealth',
  standalone: true,
  imports: [FormsModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
  <div class="mb-6 mx-rise">
    <h1 class="mx-title">Patrimônio</h1>
    <p class="mx-subtitle">Investimentos, imóveis, veículos e dívidas. Atualize os valores quando mudarem.</p>
  </div>

  <!-- Ativos -->
  <section class="mx-card mb-6 mx-rise">
    <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
      <h2 class="mx-section-title">Bens e investimentos</h2>
      <button type="button" class="btn-primary" (click)="newAsset()">Adicionar</button>
    </div>
    @for (a of mixco.assets(); track a.id) {
      <div class="mx-row flex-wrap gap-y-1">
        <span class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" [style.background]="classColor(a.assetClass)">{{ a.name.charAt(0).toUpperCase() }}</span>
        <div class="flex-1 min-w-[10rem]">
          <p class="font-semibold text-slate-900">{{ a.name }}</p>
          <p class="text-xs text-slate-500">{{ assetLabel(a.assetClass) }}{{ a.institution ? ' · ' + a.institution : '' }}</p>
        </div>
        <div class="text-right">
          <p class="font-semibold tabular text-slate-900">{{ a.currentValue | brl }}</p>
          <p class="text-xs tabular" [class.text-[var(--color-gain)]]="a.currentValue >= a.invested" [class.text-[var(--color-loss)]]="a.currentValue < a.invested">
            {{ a.currentValue - a.invested | brl }} vs. investido
          </p>
        </div>
        <div class="space-x-1 text-sm whitespace-nowrap">
          <button type="button" class="btn-link" (click)="editAsset(a)">Editar</button>
          <button type="button" class="btn-link-danger" (click)="askDelete({ kind: 'asset', id: a.id, name: a.name })">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhum bem cadastrado ainda.</p>
    }
  </section>

  <!-- Dívidas -->
  <section class="mx-card mx-rise">
    <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
      <h2 class="mx-section-title">Dívidas</h2>
      <button type="button" class="btn-primary" (click)="newLiability()">Adicionar</button>
    </div>
    @for (l of mixco.liabilities(); track l.id) {
      <div class="mx-row flex-wrap gap-y-1">
        <span class="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-[var(--color-loss)] text-sm font-bold shrink-0">{{ l.name.charAt(0).toUpperCase() }}</span>
        <div class="flex-1 min-w-[10rem]">
          <p class="font-semibold text-slate-900">{{ l.name }}</p>
          <p class="text-xs text-slate-500">
            {{ liabilityLabel(l.kind) }}{{ l.monthlyRate != null ? ' · ' + l.monthlyRate + '% a.m.' : '' }}{{ l.monthlyPayment ? ' · parcela ' + (l.monthlyPayment | brl) : '' }}
          </p>
        </div>
        <p class="font-semibold tabular text-[var(--color-loss)]">{{ l.balance | brl }}</p>
        <div class="space-x-1 text-sm whitespace-nowrap">
          <button type="button" class="btn-link" (click)="editLiability(l)">Editar</button>
          <button type="button" class="btn-link-danger" (click)="askDelete({ kind: 'liability', id: l.id, name: l.name })">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhuma dívida cadastrada. Ótimo, ou ainda falta cadastrar.</p>
    }
  </section>

  <!-- Formulário de bem -->
  @if (assetForm(); as f) {
    <div class="mx-backdrop" (click)="assetForm.set(null)">
      <div class="mx-modal max-w-md" (click)="$event.stopPropagation()">
        <h3 class="mx-modal-title">{{ f.id ? 'Editar bem' : 'Novo bem ou investimento' }}</h3>
        <form (ngSubmit)="saveAsset()" class="p-5 space-y-4">
          <label class="block text-[13px] font-medium text-slate-600">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Tesouro Selic 2029"></label>
          <label class="block text-[13px] font-medium text-slate-600">Tipo
            <select class="mx-field mt-1" name="assetClass" [(ngModel)]="f.assetClass">
              @for (c of assetClasses; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }
            </select></label>
          <label class="block text-[13px] font-medium text-slate-600">Instituição (opcional)
            <input class="mx-field mt-1" name="institution" [(ngModel)]="f.institution"></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-[13px] font-medium text-slate-600">Valor atual (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="currentValue" [(ngModel)]="f.currentValue" required></label>
            <label class="block text-[13px] font-medium text-slate-600">Total investido (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="invested" [(ngModel)]="f.invested"></label>
          </div>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="assetForm.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Formulário de dívida -->
  @if (liabilityForm(); as f) {
    <div class="mx-backdrop" (click)="liabilityForm.set(null)">
      <div class="mx-modal max-w-md" (click)="$event.stopPropagation()">
        <h3 class="mx-modal-title">{{ f.id ? 'Editar dívida' : 'Nova dívida' }}</h3>
        <form (ngSubmit)="saveLiability()" class="p-5 space-y-4">
          <label class="block text-[13px] font-medium text-slate-600">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Financiamento do carro"></label>
          <label class="block text-[13px] font-medium text-slate-600">Tipo
            <select class="mx-field mt-1" name="kind" [(ngModel)]="f.kind">
              @for (k of liabilityKinds; track k[0]) { <option [value]="k[0]">{{ k[1] }}</option> }
            </select></label>
          <label class="block text-[13px] font-medium text-slate-600">Saldo devedor (R$)
            <input class="mx-field mt-1" type="number" step="0.01" min="0" name="balance" [(ngModel)]="f.balance" required></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-[13px] font-medium text-slate-600">Juros ao mês (%)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="monthlyRate" [(ngModel)]="f.monthlyRate"></label>
            <label class="block text-[13px] font-medium text-slate-600">Parcela mensal (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="monthlyPayment" [(ngModel)]="f.monthlyPayment"></label>
          </div>
          <div class="pt-2 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="liabilityForm.set(null)">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  }

  <!-- Confirmação de exclusão -->
  @if (pendingDelete(); as t) {
    <div class="mx-backdrop" (click)="pendingDelete.set(null)">
      <div class="mx-modal max-w-sm p-6" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-semibold text-slate-800">Excluir?</h3>
        <p class="mt-2 text-sm text-slate-500">"{{ t.name }}" será removido permanentemente.</p>
        <div class="pt-6 flex justify-end gap-3">
          <button type="button" class="btn-secondary" (click)="pendingDelete.set(null)">Cancelar</button>
          <button type="button" class="btn-danger" (click)="confirmDelete()">Excluir</button>
        </div>
      </div>
    </div>
  }
</main>`,
})
export class MixcoWealthComponent implements OnInit {
  mixco = inject(MixcoService);

  assetClasses = Object.entries(ASSET_CLASS_LABELS).filter(([k]) => k !== 'caixa');
  liabilityKinds = Object.entries(LIABILITY_KIND_LABELS);

  assetForm = signal<Partial<MxAsset> | null>(null);
  liabilityForm = signal<Partial<MxLiability> | null>(null);
  pendingDelete = signal<Target | null>(null);

  ngOnInit() { void this.mixco.loadAll(); }

  classColor = colorOfClass;
  assetLabel(c: string) { return ASSET_CLASS_LABELS[c] ?? c; }
  liabilityLabel(k: string) { return (LIABILITY_KIND_LABELS as Record<string, string>)[k] ?? k; }

  newAsset() { this.assetForm.set({ assetClass: 'renda_fixa' }); }
  editAsset(a: MxAsset) { this.assetForm.set({ ...a }); }
  newLiability() { this.liabilityForm.set({ kind: 'financiamento' }); }
  editLiability(l: MxLiability) { this.liabilityForm.set({ ...l }); }
  askDelete(t: Target) { this.pendingDelete.set(t); }

  /** Campo numérico vazio vira undefined: a API trata como "não informado". */
  private num(v: unknown): number | undefined {
    return v === null || v === undefined || v === '' ? undefined : Number(v);
  }

  async saveAsset() {
    const f = this.assetForm();
    if (!f?.name || this.num(f.currentValue) === undefined) return;
    const ok = await this.mixco.save('assets', {
      id: f.id, name: f.name, assetClass: f.assetClass, institution: f.institution || undefined,
      currentValue: this.num(f.currentValue), invested: this.num(f.invested),
    }, 'Bem salvo.');
    if (ok) this.assetForm.set(null);
  }

  async saveLiability() {
    const f = this.liabilityForm();
    if (!f?.name || this.num(f.balance) === undefined) return;
    const ok = await this.mixco.save('liabilities', {
      id: f.id, name: f.name, kind: f.kind, balance: this.num(f.balance),
      monthlyRate: this.num(f.monthlyRate), monthlyPayment: this.num(f.monthlyPayment),
    }, 'Dívida salva.');
    if (ok) this.liabilityForm.set(null);
  }

  async confirmDelete() {
    const t = this.pendingDelete();
    if (!t) return;
    await this.mixco.remove(t.kind === 'asset' ? 'assets' : 'liabilities', t.id, 'Excluído.');
    this.pendingDelete.set(null);
  }
}
