import { useState } from 'react';
import { procurementRepository } from '../infrastructure/repositories/procurementRepository';
import { SupplierEntity, ContractEntity, InventoryItemEntity } from '../domain/procurement/model';

export function useProcurementContext() {
  const [suppliers] = useState<SupplierEntity[]>(() => procurementRepository.getSuppliers());
  const [contracts] = useState<ContractEntity[]>(() => procurementRepository.getContracts());
  const [inventory] = useState<InventoryItemEntity[]>(() => procurementRepository.getInventory());

  return {
    suppliers,
    contracts,
    inventory,
  };
}
