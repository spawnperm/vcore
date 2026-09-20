import { CustomScreenSchema, UiBlockSchema } from './types';
import { nats } from '../../../services/nats/natsService';

const STORAGE_KEY_SCREENS = 'mirovizor_custom_screens_v1';

export const INITIAL_CUSTOM_SCREENS: CustomScreenSchema[] = [
  {
    id: 'screen-support-tickets',
    title: 'Тикеты и рекламации',
    section: '🏢 Пользовательские справочники',
    icon: 'LifeBuoy',
    collectionName: 'support_tickets',
    isCustom: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-20T12:00:00.000Z',
    blocks: [
      {
        id: 'blk-tickets-kpi',
        type: 'metrics',
        title: 'Операционные показатели рекламаций',
        collectionName: 'support_tickets',
        visibleFields: [],
        metrics: [
          {
            id: 'm-1',
            label: 'Всего обращений',
            aggregationType: 'count',
            color: 'cyan',
            suffix: ' тикетов',
          },
          {
            id: 'm-2',
            label: 'Сумма претензий',
            aggregationType: 'sum',
            aggregationField: 'amount',
            color: 'rose',
            suffix: ' ₽',
          },
          {
            id: 'm-3',
            label: 'Средний чек рекламации',
            aggregationType: 'avg',
            aggregationField: 'amount',
            color: 'amber',
            suffix: ' ₽',
          },
        ],
      },
      {
        id: 'blk-tickets-table',
        type: 'table',
        title: 'Реестр обращений клиентов',
        collectionName: 'support_tickets',
        visibleFields: [
          'ticket_number',
          'client_name',
          'order_number',
          'category',
          'amount',
          'priority',
          'status',
          'contact_phone',
        ],
        defaultSortField: 'createdAt',
        defaultSortOrder: 'desc',
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ],
  },
  {
    id: 'screen-security-audits',
    title: 'Аудит безопасности',
    section: '🏢 Пользовательские справочники',
    icon: 'ShieldAlert',
    collectionName: 'security_audits',
    isCustom: true,
    createdAt: '2026-03-05T14:30:00.000Z',
    updatedAt: '2026-03-20T12:00:00.000Z',
    blocks: [
      {
        id: 'blk-sec-kpi',
        type: 'metrics',
        title: 'Сводка событий ИБ',
        collectionName: 'security_audits',
        visibleFields: [],
        metrics: [
          {
            id: 'ms-1',
            label: 'Зафиксировано инцидентов',
            aggregationType: 'count',
            color: 'purple',
          },
        ],
      },
      {
        id: 'blk-sec-table',
        type: 'table',
        title: 'Журнал событий безопасности и доступов',
        collectionName: 'security_audits',
        visibleFields: [
          'event_name',
          'operator_email',
          'service_target',
          'ip_address',
          'risk_level',
          'action_permitted',
          'notes',
        ],
        defaultSortField: 'createdAt',
        defaultSortOrder: 'desc',
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ],
  },
];

export class ScreenRepository {
  private screens: Map<string, CustomScreenSchema> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    let loaded: CustomScreenSchema[] | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY_SCREENS);
        if (raw) loaded = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[ScreenRepository] Failed to read from localStorage:', e);
    }

    const list = loaded && loaded.length > 0 ? loaded : INITIAL_CUSTOM_SCREENS;
    list.forEach((s) => this.screens.set(s.id, s));
  }

  private saveState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const arr = Array.from(this.screens.values());
        localStorage.setItem(STORAGE_KEY_SCREENS, JSON.stringify(arr));
      }
    } catch (e) {
      console.warn('[ScreenRepository] Failed to save to localStorage:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }

  public getScreens(): CustomScreenSchema[] {
    return Array.from(this.screens.values());
  }

  public getScreen(id: string): CustomScreenSchema | undefined {
    return this.screens.get(id);
  }

  public createScreen(
    data: Omit<CustomScreenSchema, 'createdAt' | 'updatedAt'>
  ): CustomScreenSchema {
    const now = new Date().toISOString();
    const newScreen: CustomScreenSchema = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.screens.set(newScreen.id, newScreen);
    this.saveState();

    nats.publish('schema.v1.screen.created', {
      screenId: newScreen.id,
      title: newScreen.title,
      collection: newScreen.collectionName,
      timestamp: now,
    });

    return newScreen;
  }

  public updateScreen(
    id: string,
    patch: Partial<Omit<CustomScreenSchema, 'id' | 'createdAt'>>
  ): CustomScreenSchema {
    const existing = this.screens.get(id);
    if (!existing) throw new Error(`Screen "${id}" not found`);

    const now = new Date().toISOString();
    const updated: CustomScreenSchema = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    this.screens.set(id, updated);
    this.saveState();

    nats.publish('schema.v1.screen.updated', {
      screenId: id,
      title: updated.title,
      timestamp: now,
    });

    return updated;
  }

  public deleteScreen(id: string): boolean {
    const deleted = this.screens.delete(id);
    if (deleted) {
      this.saveState();
      nats.publish('schema.v1.screen.deleted', {
        screenId: id,
        timestamp: new Date().toISOString(),
      });
    }
    return deleted;
  }

  public addBlock(screenId: string, block: UiBlockSchema): CustomScreenSchema {
    const screen = this.screens.get(screenId);
    if (!screen) throw new Error(`Screen "${screenId}" not found`);

    const updatedBlocks = [...screen.blocks, block];
    return this.updateScreen(screenId, { blocks: updatedBlocks });
  }

  public removeBlock(screenId: string, blockId: string): CustomScreenSchema {
    const screen = this.screens.get(screenId);
    if (!screen) throw new Error(`Screen "${screenId}" not found`);

    const updatedBlocks = screen.blocks.filter((b) => b.id !== blockId);
    return this.updateScreen(screenId, { blocks: updatedBlocks });
  }
}

export const screenRepository = new ScreenRepository();
