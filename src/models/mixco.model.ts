/** MiXCo — modelos de gestão de patrimônio pessoal (espelham a API em /api/mixco). */

export type AccountKind = 'checking' | 'savings' | 'cash' | 'brokerage' | 'credit';
export type AssetClass = 'renda_fixa' | 'renda_variavel' | 'fiis' | 'cripto' | 'imoveis' | 'veiculos' | 'previdencia' | 'outros';
export type LiabilityKind = 'financiamento' | 'emprestimo' | 'cartao' | 'outros';

export interface MxAccount {
  id: string;
  name: string;
  kind: AccountKind;
  institution: string | null;
  initialBalance: number;
  /** `pluggy` quando vem do open finance (saldo informado pelo banco). */
  source: 'manual' | 'pluggy';
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
  flow: { income: number; expense: number; saved: number; savingsRate: number | null; previousExpense: number };
  budget: { category: string; spent: number; previous: number; limit: number | null; percent: number | null; over: boolean }[];
  trend: { month: string; income: number; expense: number; saved: number }[];
  cardDebt: number;
  uncategorized: number;
  insights: MxInsight[];
  upcoming: MxUpcoming[];
  projection: { pendingOut: number; pendingIn: number; projectedBalance: number };
  emergencyFund: { liquid: number; avgMonthlyExpense: number; months: number | null };
  history: { month: string; assets: number; liabilities: number; netWorth: number }[];
}

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  checking: 'Conta corrente', savings: 'Poupança', cash: 'Dinheiro', brokerage: 'Corretora', credit: 'Cartão de crédito',
};

export const ASSET_CLASS_LABELS: Record<string, string> = {
  caixa: 'Caixa', renda_fixa: 'Renda fixa', renda_variavel: 'Ações', fiis: 'Fundos imobiliários',
  cripto: 'Criptomoedas', imoveis: 'Imóveis', veiculos: 'Veículos', previdencia: 'Previdência', outros: 'Outros',
};

export const LIABILITY_KIND_LABELS: Record<LiabilityKind, string> = {
  financiamento: 'Financiamento', emprestimo: 'Empréstimo', cartao: 'Cartão de crédito', outros: 'Outros',
};

/** Movimentos entre contas suas: não entram no fluxo (nem como renda, nem como gasto). */
export const INTERNAL_CATEGORIES = ['Pagamento de fatura', 'Transferência interna'];
export const EXPENSE_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Impostos', 'Outros', ...INTERNAL_CATEGORIES];
export const INCOME_CATEGORIES = ['Salário', 'Rendimentos', 'Freelance', 'Presentes', 'Outros', ...INTERNAL_CATEGORIES];
/** Categorias que fazem sentido para limite de orçamento. */
export const BUDGET_CATEGORIES = EXPENSE_CATEGORIES.filter(c => !INTERNAL_CATEGORIES.includes(c));

export interface MxInsight {
  level: 'alert' | 'warn' | 'info' | 'ok';
  title: string;
  text: string;
  link?: string;
}

export interface MxGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}

export interface MxRule {
  id: string;
  keyword: string;
  category: string;
}

export interface PluggyItem {
  itemId: string;
  connector: string | null;
  status: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface PluggyStatus {
  configured: boolean;
  items: PluggyItem[];
  lastSyncAt: string | null;
}

export interface MxRecurring {
  id: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  dayOfMonth: number;
  category: string;
}

/** Conta fixa projetada para o mês: `paid` quando já existe lançamento com a mesma descrição. */
export interface MxUpcoming {
  id: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  day: number;
  paid: boolean;
  overdue: boolean;
}
