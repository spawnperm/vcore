import { Money } from '../common/types';

export interface FunnelDeal {
  id: string;
  clientName: string;
  title: string;
  amount: Money;
  manager: string;
  probability: number;
  stage: 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won';
}

export interface ClientEntity {
  id: string;
  inn: string;
  name: string;
  tier: 'VIP' | 'Standard' | 'Enterprise';
  ordersCount: number;
  totalTurnover: Money;
  contactPerson: string;
  email: string;
  status: 'active' | 'review' | 'blocked';
}
