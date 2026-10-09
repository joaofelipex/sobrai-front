import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CertificateStatus, FiscalSettings, FiscalStatus, NfseDocument } from '../models/nfse.model';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

/**
 * Serviço da integração com a NFS-e Nacional.
 *
 * Toda a parte sensível (certificado, assinatura, comunicação com a SEFIN) fica no backend;
 * aqui só se configura, dispara a emissão/cancelamento e acompanha o resultado.
 */
@Injectable({ providedIn: 'root' })
export class NfseService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private fiscalUrl = `${environment.backendUrl}/api/fiscal`;
  private nfseUrl = `${environment.backendUrl}/api/nfse`;

  status = signal<FiscalStatus | null>(null);
  settings = signal<FiscalSettings | null>(null);
  documents = signal<NfseDocument[]>([]);

  /** IDs de notas fiscais com emissão/cancelamento em andamento (evita clique duplo). */
  busy = signal<ReadonlySet<string>>(new Set());

  /** Última NFS-e de cada nota fiscal (a lista vem da mais recente para a mais antiga). */
  latestByInvoice = computed(() => {
    const map = new Map<string, NfseDocument>();
    for (const doc of this.documents()) if (!map.has(doc.invoiceId)) map.set(doc.invoiceId, doc);
    return map;
  });

  /** Pronta para emitir: dados fiscais + certificado salvos e ambiente liberado. */
  isReady = computed(() => {
    const s = this.status();
    return !!s && s.settingsConfigured && s.certificate.configured && s.ambiente !== null;
  });

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this.status.set(await firstValueFrom(this.http.get<FiscalStatus>(`${this.fiscalUrl}/status`)));
      this.documents.set(await firstValueFrom(this.http.get<NfseDocument[]>(this.nfseUrl)));
    } catch (err) {
      console.error('Falha ao carregar o estado da NFS-e', err);
    }
    try {
      this.settings.set(await firstValueFrom(this.http.get<FiscalSettings>(`${this.fiscalUrl}/settings`)));
    } catch {
      this.settings.set(null); // 404 = ainda não configurado
    }
  }

  async saveSettings(settings: FiscalSettings): Promise<boolean> {
    try {
      this.settings.set(await firstValueFrom(this.http.put<FiscalSettings>(`${this.fiscalUrl}/settings`, settings)));
      await this.refresh();
      return true;
    } catch (err) {
      this.toastService.showError(this.message(err, 'Não foi possível salvar os dados fiscais.'));
      return false;
    }
  }

  async uploadCertificate(file: File, password: string): Promise<boolean> {
    try {
      const pfxBase64 = this.toBase64(await file.arrayBuffer());
      const cert = await firstValueFrom(
        this.http.put<CertificateStatus>(`${this.fiscalUrl}/certificate`, { pfxBase64, password })
      );
      this.status.update(s => (s ? { ...s, certificate: cert } : s));
      return true;
    } catch (err) {
      this.toastService.showError(this.message(err, 'Não foi possível enviar o certificado.'));
      return false;
    }
  }

  async removeCertificate(): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.fiscalUrl}/certificate`));
      await this.refresh();
    } catch (err) {
      this.toastService.showError(this.message(err, 'Não foi possível remover o certificado.'));
    }
  }

  /** Emite a NFS-e da nota fiscal. O resultado (autorizada ou rejeitada) entra em `documents`. */
  async emit(invoiceId: string): Promise<void> {
    this.setBusy(invoiceId, true);
    try {
      const doc = await firstValueFrom(this.http.post<NfseDocument>(`${this.nfseUrl}/emitir`, { invoiceId }));
      this.upsert(doc);
      this.toastService.showSuccess(`NFS-e autorizada${doc.numeroNfse ? ` (nº ${doc.numeroNfse})` : ''}.`);
    } catch (err) {
      // 422/502 trazem o documento com o erro da SEFIN; 409/400 trazem só { message }.
      const body = err instanceof HttpErrorResponse ? err.error : null;
      if (body && body.id && body.status) {
        this.upsert(body as NfseDocument);
        this.toastService.showError(`NFS-e não emitida: ${(body as NfseDocument).erro ?? 'erro desconhecido'}`);
      } else {
        this.toastService.showError(this.message(err, 'Não foi possível emitir a NFS-e.'));
      }
    } finally {
      this.setBusy(invoiceId, false);
    }
  }

  async cancel(doc: NfseDocument, codigoMotivo: '1' | '2' | '9', motivo: string): Promise<boolean> {
    this.setBusy(doc.invoiceId, true);
    try {
      const updated = await firstValueFrom(
        this.http.post<NfseDocument>(`${this.nfseUrl}/${doc.id}/cancelar`, { codigoMotivo, motivo })
      );
      this.upsert(updated);
      this.toastService.show('NFS-e cancelada.', 'info');
      return true;
    } catch (err) {
      this.toastService.showError(this.message(err, 'Não foi possível cancelar a NFS-e.'));
      return false;
    } finally {
      this.setBusy(doc.invoiceId, false);
    }
  }

  /** Baixa o XML da NFS-e autorizada (documento fiscal). */
  async downloadXml(doc: NfseDocument): Promise<void> {
    try {
      const xml = await firstValueFrom(this.http.get(`${this.nfseUrl}/${doc.id}/xml`, { responseType: 'text' }));
      const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFSe-${doc.numeroNfse ?? doc.chaveAcesso ?? doc.id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.toastService.showError(this.message(err, 'Não foi possível baixar o XML.'));
    }
  }

  private upsert(doc: NfseDocument) {
    this.documents.update(docs => [doc, ...docs.filter(d => d.id !== doc.id)]);
  }

  private setBusy(invoiceId: string, on: boolean) {
    this.busy.update(set => {
      const next = new Set(set);
      if (on) next.add(invoiceId); else next.delete(invoiceId);
      return next;
    });
  }

  private message(err: unknown, fallback: string): string {
    const msg = err instanceof HttpErrorResponse ? err.error?.message : null;
    return typeof msg === 'string' ? msg : fallback;
  }

  private toBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
}
