import { UxReviewPin, UxReviewPinProps } from '../../domain/review/model';

export interface IReviewRepository {
  getAll(): UxReviewPin[];
  findByScreen(screenId: string): UxReviewPin[];
  add(pin: UxReviewPin): void;
  remove(id: string): void;
}

const INITIAL_PINS: UxReviewPinProps[] = [
  {
    id: 'p1',
    screenId: 'screen-orders',
    xPercent: 78,
    yPercent: 32,
    author: 'Иван Петров (Архитектор)',
    text: 'Кнопка «Оформить возврат» должна требовать подтверждения и запускать распределённую сагу с проверкой лимита.',
    time: '12 мин назад',
    status: 'open',
  },
  {
    id: 'p2',
    screenId: 'screen-billing',
    xPercent: 62,
    yPercent: 44,
    author: 'Алексей Кузнецов (TechLead)',
    text: 'Необходимо отображать latency каждого шага саги в реальном времени при получении heartbeat из NATS JetStream.',
    time: '5 мин назад',
    status: 'open',
  },
];

class InMemoryReviewRepository implements IReviewRepository {
  private pins: Map<string, UxReviewPin> = new Map();

  constructor() {
    INITIAL_PINS.forEach((item) => {
      this.pins.set(item.id, new UxReviewPin(item));
    });
  }

  public getAll(): UxReviewPin[] {
    return Array.from(this.pins.values());
  }

  public findByScreen(screenId: string): UxReviewPin[] {
    return Array.from(this.pins.values()).filter((p) => p.screenId === screenId);
  }

  public add(pin: UxReviewPin): void {
    this.pins.set(pin.id, pin);
  }

  public remove(id: string): void {
    this.pins.delete(id);
  }
}

export const reviewRepository: IReviewRepository = new InMemoryReviewRepository();
