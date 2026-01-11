
/**
 * Define os tipos de perfil de empresa suportados pelo sistema.
 * - `mei`: Microempreendedor Individual
 * - `simples`: Empresa optante pelo Simples Nacional
 * - `autonomo`: Profissional Autônomo
 */
export type CompanyType = 'mei' | 'simples' | 'autonomo';

/**
 * Representa o perfil de uma empresa ou profissional autônomo no sistema.
 */
export interface CompanyProfile {
  /**
   * O nome da empresa ou do profissional.
   */
  name: string;

  /**
   * O tipo de enquadramento da empresa.
   */
  type: CompanyType;

  /**
   * A receita mensal estimada ou declarada.
   */
  monthlyRevenue: number;

  /**
   * O número do Cadastro Nacional da Pessoa Jurídica (CNPJ).
   * Opcional, especialmente para profissionais autônomos.
   */
  cnpj?: string;

  /**
   * O número de telefone para contato.
   */
  phone?: string;

  /**
   * O endereço de e-mail para contato.
   */
  email?: string;

  /**
   * O endereço físico da empresa.
   */
  address?: {
    /** A rua do endereço. */
    street: string;
    /** O número do endereço. */
    number: string;
    /** Informações adicionais do endereço. */
    complement?: string;
    /** O bairro do endereço. */
    neighborhood: string;
    /** A cidade do endereço. */
    city: string;
    /** O estado (UF) do endereço. */
    state: string;
    /** O Código de Endereçamento Postal (CEP). */
    zipCode: string;
  };
}
