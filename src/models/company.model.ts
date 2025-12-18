
export interface CompanyProfile {
  toPromise(): unknown;
  name: string;
  type: 'mei' | 'simples' | 'autonomo';
  monthlyRevenue: number;
}
