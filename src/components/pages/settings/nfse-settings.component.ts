import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiscalSettings } from '../../../models/nfse.model';
import { NfseService } from '../../../services/nfse.service';
import { ToastService } from '../../../services/toast.service';

const EMPTY: FiscalSettings = {
  cnpj: '',
  inscricaoMunicipal: '',
  codMunicipioIbge: '',
  opSimpNac: '2',
  regApTribSN: null,
  regEspTrib: '0',
  serie: '1',
  proximoNumero: 1,
  codTribNac: '',
  codTribMun: '',
  aliquotaIss: null,
};

/**
 * Seção "NFS-e Nacional" da tela de Configurações: dados fiscais do emitente e certificado digital A1.
 */
@Component({
  selector: 'app-nfse-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nfse-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfseSettingsComponent {
  nfse = inject(NfseService);
  private toast = inject(ToastService);

  form = signal<FiscalSettings>({ ...EMPTY });
  isSaving = signal(false);

  certFile = signal<File | null>(null);
  certPassword = signal('');
  isUploading = signal(false);

  constructor() {
    // Preenche o formulário quando os dados salvos chegam do servidor.
    effect(() => {
      const saved = this.nfse.settings();
      if (saved) this.form.set({ ...EMPTY, ...saved });
    });
  }

  update<K extends keyof FiscalSettings>(key: K, value: FiscalSettings[K]) {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  async save() {
    this.isSaving.set(true);
    const f = this.form();
    const ok = await this.nfse.saveSettings({
      ...f,
      inscricaoMunicipal: f.inscricaoMunicipal || null,
      codTribMun: f.codTribMun || null,
      regApTribSN: f.opSimpNac === '3' ? f.regApTribSN || null : null,
      aliquotaIss: f.aliquotaIss === null || (f.aliquotaIss as unknown) === '' ? null : Number(f.aliquotaIss),
      proximoNumero: Number(f.proximoNumero) || 1,
    });
    this.isSaving.set(false);
    if (ok) this.toast.show('Dados fiscais salvos.');
  }

  onFileChosen(event: Event) {
    const input = event.target as HTMLInputElement;
    this.certFile.set(input.files && input.files[0] ? input.files[0] : null);
  }

  async upload() {
    const file = this.certFile();
    if (!file || !this.certPassword()) return;
    this.isUploading.set(true);
    const ok = await this.nfse.uploadCertificate(file, this.certPassword());
    this.isUploading.set(false);
    if (ok) {
      this.certFile.set(null);
      this.certPassword.set('');
      this.toast.show('Certificado digital salvo.');
    }
  }
}
