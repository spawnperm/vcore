import { Order, OrderProps } from '../../domain/orders/model';
import { Money } from '../../domain/common/types';

export interface IOrderRepository {
  getAll(): Order[];
  findById(id: string): Order | undefined;
  save(order: Order): void;
}

const INITIAL_ORDERS_DATA: OrderProps[] = [
  {
    id: 'ord-1',
    number: '#ORD-98421',
    clientName: 'ООО «Вектор Трейд»',
    total: new Money(14200),
    status: 'PAID',
    refundState: 'PROCESSING',
    refundProgress: 60,
    items: [
      { id: 'item-1', name: 'Оптический коммутатор 10G', quantity: 1, price: new Money(14200) },
    ],
    createdAt: '2026-09-18 14:30',
  },
  {
    id: 'ord-2',
    number: '#ORD-98420',
    clientName: 'ИП Смирнов А.В.',
    total: new Money(54000),
    status: 'PAID',
    refundState: 'NONE',
    items: [
      { id: 'item-2', name: 'Серверная стойка 42U', quantity: 2, price: new Money(27000) },
    ],
    createdAt: '2026-09-18 11:15',
  },
  {
    id: 'ord-3',
    number: '#ORD-98419',
    clientName: 'АО «ТехноПром Инжиниринг»',
    total: new Money(128900),
    status: 'PAID',
    refundState: 'NONE',
    items: [
      { id: 'item-3', name: 'Промышленный контроллер PLC-400', quantity: 1, price: new Money(128900) },
    ],
    createdAt: '2026-09-17 16:45',
  },
  {
    id: 'ord-4',
    number: '#ORD-98418',
    clientName: 'ООО «Северная Логистика»',
    total: new Money(32500),
    status: 'REFUNDED',
    refundState: 'COMPLETED',
    refundProgress: 100,
    items: [
      { id: 'item-4', name: 'Сканер штрих-кодов 2D Pro', quantity: 5, price: new Money(6500) },
    ],
    createdAt: '2026-09-16 09:20',
  },
];

class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();

  constructor() {
    INITIAL_ORDERS_DATA.forEach((item) => {
      this.orders.set(item.id, new Order(item));
    });
  }

  public getAll(): Order[] {
    return Array.from(this.orders.values());
  }

  public findById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public save(order: Order): void {
    this.orders.set(order.id, order);
  }
}

export const orderRepository: IOrderRepository = new InMemoryOrderRepository();
