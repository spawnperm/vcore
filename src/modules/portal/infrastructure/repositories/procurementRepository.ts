import { SupplierEntity, ContractEntity, InventoryItemEntity } from '../../domain/procurement/model';
import { Money } from '../../domain/common/types';

export interface IProcurementRepository {
  getSuppliers(): SupplierEntity[];
  getContracts(): ContractEntity[];
  getInventory(): InventoryItemEntity[];
}

class InMemoryProcurementRepository implements IProcurementRepository {
  private suppliers: SupplierEntity[] = [
    {
      id: 'sup-1',
      name: 'АО «МикроЭлектроника»',
      category: 'Электронные компоненты и процессоры',
      rating: 4.9,
      activeContracts: 3,
      country: 'Россия',
      paymentTerms: 'Постоплата 30 дней',
      reliabilityScore: 98,
    },
    {
      id: 'sup-2',
      name: 'ООО «ПромКабельХолдинг»',
      category: 'Оптические и силовые линии связи',
      rating: 4.7,
      activeContracts: 2,
      country: 'Россия',
      paymentTerms: 'Предоплата 50%',
      reliabilityScore: 94,
    },
    {
      id: 'sup-3',
      name: 'Shenzhen Optics Ltd',
      category: 'Оптические модули SFP+ и трансиверы',
      rating: 4.8,
      activeContracts: 1,
      country: 'Китай',
      paymentTerms: 'Аккредитив (L/C)',
      reliabilityScore: 92,
    },
  ];

  private contracts: ContractEntity[] = [
    {
      id: 'cnt-1',
      number: 'ДОГ-2026/089',
      supplierName: 'АО «МикроЭлектроника»',
      subject: 'Поставка контроллеров PLC-400 и микросхем питания',
      totalValue: new Money(12500000),
      status: 'active',
      signDate: '2026-01-15',
      validUntil: '2026-12-31',
      edoSigned: true,
    },
    {
      id: 'cnt-2',
      number: 'ДОГ-2026/104',
      supplierName: 'ООО «ПромКабельХолдинг»',
      subject: 'Монтажные бухты оптоволокна и патч-корды',
      totalValue: new Money(3400000),
      status: 'active',
      signDate: '2026-02-01',
      validUntil: '2026-11-30',
      edoSigned: true,
    },
    {
      id: 'cnt-3',
      number: 'ДОГ-2026/142',
      supplierName: 'Shenzhen Optics Ltd',
      subject: 'Трансиверы 100G QSFP28',
      totalValue: new Money(6700000),
      status: 'under_signature',
      signDate: '2026-09-10',
      validUntil: '2027-03-31',
      edoSigned: false,
    },
  ];

  private inventory: InventoryItemEntity[] = [
    {
      id: 'inv-1',
      sku: 'SW-10G-48P',
      name: 'Коммутатор управляемый 10G L3 (48 портов)',
      warehouse: 'Центральный склад (Москва)',
      availableStock: 14,
      reservedStock: 3,
      unit: 'шт.',
      minThreshold: 5,
      status: 'normal',
    },
    {
      id: 'inv-2',
      sku: 'CAB-OPT-OM4',
      name: 'Кабель оптический OM4 50/125 (бухта 500м)',
      warehouse: 'Центральный склад (Москва)',
      availableStock: 2,
      reservedStock: 2,
      unit: 'бухта',
      minThreshold: 4,
      status: 'low_stock',
    },
    {
      id: 'inv-3',
      sku: 'SRV-RACK-42U',
      name: 'Стойка телекоммуникационная 42U 800x1000',
      warehouse: 'Региональный хаб (СПб)',
      availableStock: 8,
      reservedStock: 1,
      unit: 'шт.',
      minThreshold: 2,
      status: 'normal',
    },
    {
      id: 'inv-4',
      sku: 'SFP-10G-LR',
      name: 'Трансивер SFP+ 10G LR 1310nm 10km',
      warehouse: 'Центральный склад (Москва)',
      availableStock: 96,
      reservedStock: 20,
      unit: 'шт.',
      minThreshold: 25,
      status: 'normal',
    },
  ];

  public getSuppliers(): SupplierEntity[] {
    return [...this.suppliers];
  }

  public getContracts(): ContractEntity[] {
    return [...this.contracts];
  }

  public getInventory(): InventoryItemEntity[] {
    return [...this.inventory];
  }
}

export const procurementRepository: IProcurementRepository = new InMemoryProcurementRepository();
