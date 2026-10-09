/** Dados fiscais do emitente, usados para montar a DPS da NFS-e Nacional. */
export interface FiscalSettings {
  cnpj: string;
  inscricaoMunicipal?: string | null;
  /** Código IBGE do município (7 dígitos). */
  codMunicipioIbge: string;
  /** 1 - Não optante; 2 - MEI; 3 - ME/EPP do Simples Nacional. */
  opSimpNac: '1' | '2' | '3';
  /** Regime de apuração do Simples (obrigatório quando opSimpNac = 3). */
  regApTribSN?: '1' | '2' | '3' | null;
  /** Regime especial de tributação (0 = nenhum). */
  regEspTrib: string;
  serie: string;
  proximoNumero: number;
  /** Código de tributação nacional do serviço (6 dígitos). */
  codTribNac: string;
  codTribMun?: string | null;
  aliquotaIss?: number | null;
}

export interface CertificateStatus {
  configured: boolean;
  subject: string | null;
  validTo: string | null;
  uploadedAt: string | null;
}

export interface FiscalStatus {
  /** 1 - Produção; 2 - Homologação; null se o backend bloqueou. */
  ambiente: 1 | 2 | null;
  ambienteErro: string | null;
  secretConfigured: boolean;
  settingsConfigured: boolean;
  certificate: CertificateStatus;
}

export type NfseStatus = 'processing' | 'authorized' | 'rejected' | 'indeterminate' | 'canceled';

/** Tentativa de emissão de NFS-e para uma nota fiscal. */
export interface NfseDocument {
  id: string;
  invoiceId: string;
  ambiente: 1 | 2;
  dpsId: string;
  nDPS: number;
  status: NfseStatus;
  chaveAcesso: string | null;
  numeroNfse: string | null;
  erro: string | null;
  createdAt: string;
  updatedAt: string;
}
