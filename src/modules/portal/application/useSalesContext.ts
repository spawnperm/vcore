import { useState } from 'react';
import { salesRepository } from '../infrastructure/repositories/salesRepository';
import { FunnelDeal, ClientEntity } from '../domain/sales/model';

export function useSalesContext() {
  const [deals] = useState<FunnelDeal[]>(() => salesRepository.getDeals());
  const [clients] = useState<ClientEntity[]>(() => salesRepository.getClients());

  return {
    deals,
    clients,
  };
}
