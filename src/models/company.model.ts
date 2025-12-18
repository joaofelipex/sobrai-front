
// Tipos de perfil de empresa suportados
export type CompanyType = 'mei' | 'simples' | 'autonomo';

export interface CompanyProfile {
  // Nome da empresa
  name: string;
  
  // Tipo de empresa (MEI, Simples ou Autônomo)
  type: CompanyType;
  
  // Faturamento mensal da empresa
  monthlyRevenue: number;
  
  // CNPJ (opcional, principalmente para autônomos)
  cnpj?: string;
  
  // Telefone para contato (opcional)
  phone?: string;
  
  // E-mail para contato (opcional)
  email?: string;
  
  // Endereço da empresa (opcional)
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}
