import { Money } from '../common/types';

export interface SupplierEntity {
  id: string;
  name: string;
  category: string;
  rating: number; // 1 to 5
  activeContracts: number;
  country: string;
  paymentTerms: string;
  reliabilityScore: number;
}

export interface ContractEntity {
  id: string;
  number: string;
  supplierName: string;
  subject: string;
  totalValue: Money;
  status: 'active' | 'draft' | 'under_signature' | 'expired';
  signDate: string;
  validUntil: string;
  edoSigned: boolean;
}

export interface InventoryItemEntity {
  id: string;
  sku: string;
  name: string;
  warehouse: string;
  availableStock: number;
  reservedStock: number;
  unit: string;
  minThreshold: number;
  status: 'normal' | 'low_stock' | 'excess';
}
