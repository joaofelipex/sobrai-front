/** MiXCo — modelos de gestão de patrimônio pessoal (espelham a API em /api/mixco). */

export type AccountKind = 'checking' | 'savings' | 'cash' | 'brokerage';
export type AssetClass = 'renda_fixa' | 'renda_variavel' | 'fiis' | 'cripto' | 'imoveis' | 'veiculos' | 'previdencia' | 'outros';
export type LiabilityKind = 'financiamento' | 'emprestimo' | 'cartao' | 'outros';

export interface MxAccount {
  id: string;
  name: string;
  kind: AccountKind;
  institution: string | null;
  initialBalance: number;
  /** Saldo atual: saldo inicial + receitas - despesas (calculado no servidor). */
  balance: number;
}

export interface MxTransaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  /** AAAA-MM-DD */
  date: string;
  category: string;
}

export interface MxAsset {
  id: string;
  name: string;
  assetClass: AssetClass;
  institution: string | null;
  /** Quanto foi colocado (custo). */
  invested: number;
  currentValue: number;
  updatedAt: string;
}

export interface MxLiability {
  id: string;
  name: string;
  kind: LiabilityKind;
  balance: number;
  /** Juros ao mês, em %. */
  monthlyRate: number | null;
  monthlyPayment: number | null;
}

export interface MxBudget {
  category: string;
  monthlyLimit: number;
}

export interface MxSummary {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  cash: number;
  debtToAssets: number | null;
  monthlyDebtPayments: number;
  investments: { invested: number; current: number; profit: number; returnPercent: number | null };
  allocation: { assetClass: string; value: number; percent: number }[];
  flow: { income: number; expense: number; saved: number; savingsRate: number | null };
  budget: { category: string; spent: number; limit: number | null; percent: number | null; over: boolean }[];
  emergencyFund: { liquid: number; avgMonthlyExpense: number; months: number | null };
  history: { month: string; assets: number; liabilities: number; netWorth: number }[];
}

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  checking: 'Conta corrente', savings: 'Poupança', cash: 'Dinheiro', brokerage: 'Corretora',
};

export const ASSET_CLASS_LABELS: Record<string, string> = {
  caixa: 'Caixa', renda_fixa: 'Renda fixa', renda_variavel: 'Ações', fiis: 'Fundos imobiliários',
  cripto: 'Criptomoedas', imoveis: 'Imóveis', veiculos: 'Veículos', previdencia: 'Previdência', outros: 'Outros',
};

export const LIABILITY_KIND_LABELS: Record<LiabilityKind, string> = {
  financiamento: 'Financiamento', emprestimo: 'Empréstimo', cartao: 'Cartão de crédito', outros: 'Outros',
};

export const EXPENSE_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Impostos', 'Outros'];
export const INCOME_CATEGORIES = ['Salário', 'Rendimentos', 'Freelance', 'Presentes', 'Outros'];
