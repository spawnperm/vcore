import { FunnelDeal, ClientEntity } from '../../domain/sales/model';
import { Money } from '../../domain/common/types';

export interface ISalesRepository {
  getDeals(): FunnelDeal[];
  getClients(): ClientEntity[];
}

class InMemorySalesRepository implements ISalesRepository {
  private deals: FunnelDeal[] = [
    {
      id: 'deal-1',
      clientName: 'ПАО «Газпром Автоматизация»',
      title: 'Внедрение телеметрических шлюзов',
      amount: new Money(4200000),
      manager: 'Алексей Кузнецов',
      probability: 80,
      stage: 'negotiation',
    },
    {
      id: 'deal-2',
      clientName: 'ООО «Маркет Ритейл»',
      title: 'Интеграция кассовых узлов и Saga Billing',
      amount: new Money(1850000),
      manager: 'Мария Сидорова',
      probability: 60,
      stage: 'proposal',
    },
    {
      id: 'deal-3',
      clientName: 'АО «АгроХолдинг Восток»',
      title: 'Система мониторинга складов и парка',
      amount: new Money(950000),
      manager: 'Алексей Кузнецов',
      probability: 40,
      stage: 'qualification',
    },
    {
      id: 'deal-4',
      clientName: 'ООО «Логистик Системс»',
      title: 'Поставка серверного кластера',
      amount: new Money(3100000),
      manager: 'Иван Петров',
      probability: 100,
      stage: 'won',
    },
    {
      id: 'deal-5',
      clientName: 'Индустриальный парк «Запад»',
      title: 'Лицензии на API Gateway & Auth',
      amount: new Money(620000),
      manager: 'Мария Сидорова',
      probability: 20,
      stage: 'lead',
    },
  ];

  private clients: ClientEntity[] = [
    {
      id: 'cli-1',
      inn: '7702984102',
      name: 'ООО «Вектор Трейд»',
      tier: 'VIP',
      ordersCount: 42,
      totalTurnover: new Money(3420000),
      contactPerson: 'Сергей Николаев (Коммерческий директор)',
      email: 'nikolaev@vectortrade.ru',
      status: 'active',
    },
    {
      id: 'cli-2',
      inn: '7810339481',
      name: 'ИП Смирнов А.В.',
      tier: 'Standard',
      ordersCount: 12,
      totalTurnover: new Money(480000),
      contactPerson: 'Алексей Смирнов',
      email: 'smirnov.av@mail.ru',
      status: 'active',
    },
    {
      id: 'cli-3',
      inn: '5001928411',
      name: 'АО «ТехноПром Инжиниринг»',
      tier: 'Enterprise',
      ordersCount: 89,
      totalTurnover: new Money(18400000),
      contactPerson: 'Дмитрий Орлов (Руководитель закупок)',
      email: 'd.orlov@technoprom.org',
      status: 'active',
    },
    {
      id: 'cli-4',
      inn: '6671049281',
      name: 'ООО «Северная Логистика»',
      tier: 'Standard',
      ordersCount: 8,
      totalTurnover: new Money(290000),
      contactPerson: 'Ольга Белова',
      email: 'belova@sevlog.ru',
      status: 'review',
    },
  ];

  public getDeals(): FunnelDeal[] {
    return [...this.deals];
  }

  public getClients(): ClientEntity[] {
    return [...this.clients];
  }
}

export const salesRepository: ISalesRepository = new InMemorySalesRepository();
