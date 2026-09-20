export type BlockType = 'table' | 'form' | 'metrics' | 'details';

export interface MetricCardConfig {
  id: string;
  label: string;
  aggregationType: 'count' | 'sum' | 'avg';
  aggregationField?: string;
  prefix?: string;
  suffix?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export interface UiBlockSchema {
  id: string;
  type: BlockType;
  title: string;
  collectionName: string;
  visibleFields: string[]; // Поля для отображения
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  metrics?: MetricCardConfig[];
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface CustomScreenSchema {
  id: string;
  title: string;
  section: string;
  icon: string; // Lucide icon name
  collectionName: string;
  blocks: UiBlockSchema[];
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}
