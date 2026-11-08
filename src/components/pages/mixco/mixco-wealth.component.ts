import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MixcoService } from '../../../services/mixco.service';
import { ASSET_CLASS_LABELS, LIABILITY_KIND_LABELS, MxAsset, MxLiability } from '../../../models/mixco.model';
import { BrlPipe } from './brl.pipe';

type Target = { kind: 'asset' | 'liability'; id: string; name: string };

/** Bens, investimentos e dívidas: o que você tem e o que você deve. */
@Component({
  selector: 'app-mixco-wealth',
  standalone: true,
  imports: [FormsModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<main class="p-4 sm:p-6 lg:p-8">
  <div class="mb-6">
    <h1 class="text-xl font-semibold text-slate-900">Patrimônio</h1>
    <p class="text-sm text-slate-500 mt-0.5">Investimentos, imóveis, veículos e dívidas. Atualize os valores quando mudarem.</p>
  </div>

  <!-- Ativos -->
  <section class="bg-white border border-slate-200/80 rounded-lg mb-6">
    <div class="flex items-center justify-between p-4 border-b border-slate-200/80">
      <h2 class="font-semibold text-slate-800">Bens e investimentos</h2>
      <button type="button" class="btn-primary" (click)="newAsset()">Adicionar</button>
    </div>
    @for (a of mixco.assets(); track a.id) {
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-b border-slate-100 last:border-0">
        <div class="flex-1 min-w-[10rem]">
          <p class="font-medium text-slate-800">{{ a.name }}</p>
          <p class="text-xs text-slate-500">{{ assetLabel(a.assetClass) }}{{ a.institution ? ' · ' + a.institution : '' }}</p>
        </div>
        <div class="text-right">
          <p class="font-medium tabular">{{ a.currentValue | brl }}</p>
          <p class="text-xs tabular" [class.text-success-700]="a.currentValue >= a.invested" [class.text-red-700]="a.currentValue < a.invested">
            {{ a.currentValue - a.invested | brl }} vs. investido
          </p>
        </div>
        <div class="space-x-3 text-sm">
          <button type="button" class="text-slate-600 hover:text-emerald-700" (click)="editAsset(a)">Editar</button>
          <button type="button" class="text-slate-600 hover:text-red-700" (click)="askDelete({ kind: 'asset', id: a.id, name: a.name })">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhum bem cadastrado ainda.</p>
    }
  </section>

  <!-- Dívidas -->
  <section class="bg-white border border-slate-200/80 rounded-lg">
    <div class="flex items-center justify-between p-4 border-b border-slate-200/80">
      <h2 class="font-semibold text-slate-800">Dívidas</h2>
      <button type="button" class="btn-primary" (click)="newLiability()">Adicionar</button>
    </div>
    @for (l of mixco.liabilities(); track l.id) {
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-b border-slate-100 last:border-0">
        <div class="flex-1 min-w-[10rem]">
          <p class="font-medium text-slate-800">{{ l.name }}</p>
          <p class="text-xs text-slate-500">
            {{ liabilityLabel(l.kind) }}{{ l.monthlyRate != null ? ' · ' + l.monthlyRate + '% a.m.' : '' }}{{ l.monthlyPayment ? ' · parcela ' + (l.monthlyPayment | brl) : '' }}
          </p>
        </div>
        <p class="font-medium tabular text-red-700">{{ l.balance | brl }}</p>
        <div class="space-x-3 text-sm">
          <button type="button" class="text-slate-600 hover:text-emerald-700" (click)="editLiability(l)">Editar</button>
          <button type="button" class="text-slate-600 hover:text-red-700" (click)="askDelete({ kind: 'liability', id: l.id, name: l.name })">Excluir</button>
        </div>
      </div>
    } @empty {
      <p class="p-6 text-sm text-slate-500 text-center">Nenhuma dívida cadastrada. Ótimo, ou ainda falta cadastrar.</p>
    }
  </section>

  <!-- Formulário de bem -->
  @if (assetForm(); as f) {
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="assetForm.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">{{ f.id ? 'Editar bem' : 'Novo bem ou investimento' }}</h3>
        <form (ngSubmit)="saveAsset()" class="p-5 space-y-4">
          <label class="block text-sm font-medium text-slate-700">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Tesouro Selic 2029"></label>
          <label class="block text-sm font-medium text-slate-700">Tipo
            <select class="mx-field mt-1" name="assetClass" [(ngModel)]="f.assetClass">
              @for (c of assetClasses; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }
            </select></label>
          <label class="block text-sm font-medium text-slate-700">Instituição (opcional)
            <input class="mx-field mt-1" name="institution" [(ngModel)]="f.institution"></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium text-slate-700">Valor atual (R$)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="currentValue" [(ngModel)]="f.currentValue" required></label>
            <label class="block text-sm font-medium text-slate-700">Total investido (R$)
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
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="liabilityForm.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <h3 class="p-5 border-b border-slate-200/80 text-lg font-semibold text-slate-800">{{ f.id ? 'Editar dívida' : 'Nova dívida' }}</h3>
        <form (ngSubmit)="saveLiability()" class="p-5 space-y-4">
          <label class="block text-sm font-medium text-slate-700">Nome
            <input class="mx-field mt-1" name="name" [(ngModel)]="f.name" required placeholder="Ex: Financiamento do carro"></label>
          <label class="block text-sm font-medium text-slate-700">Tipo
            <select class="mx-field mt-1" name="kind" [(ngModel)]="f.kind">
              @for (k of liabilityKinds; track k[0]) { <option [value]="k[0]">{{ k[1] }}</option> }
            </select></label>
          <label class="block text-sm font-medium text-slate-700">Saldo devedor (R$)
            <input class="mx-field mt-1" type="number" step="0.01" min="0" name="balance" [(ngModel)]="f.balance" required></label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium text-slate-700">Juros ao mês (%)
              <input class="mx-field mt-1" type="number" step="0.01" min="0" name="monthlyRate" [(ngModel)]="f.monthlyRate"></label>
            <label class="block text-sm font-medium text-slate-700">Parcela mensal (R$)
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
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="pendingDelete.set(null)">
      <div class="bg-white rounded-lg shadow-sm w-full max-w-sm p-6" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-semibold text-slate-800">Excluir?</h3>
        <p class="mt-2 text-sm text-slate-500">"{{ t.name }}" será removido permanentemente.</p>
        <div class="pt-6 flex justify-end gap-3">
          <button type="button" class="btn-secondary" (click)="pendingDelete.set(null)">Cancelar</button>
          <button type="button" class="px-3.5 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700" (click)="confirmDelete()">Excluir</button>
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
