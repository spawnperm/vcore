export type FieldType =
  | 'string'       // Однострочный текст
  | 'text'         // Многострочный текст
  | 'integer'      // Целое число
  | 'number'       // Число с плавающей точкой
  | 'money'        // Денежная сумма (с форматированием в ₽)
  | 'boolean'      // Флаг (Да/Нет, Switch)
  | 'date'         // Дата (YYYY-MM-DD)
  | 'datetime'     // Дата и время
  | 'select'       // Одиночный выбор из списка
  | 'multiSelect'  // Множественный выбор
  | 'status'       // Статус с бейджем
  | 'email'        // Email адрес
  | 'phone'        // Номер телефона
  | 'belongsTo';   // Связь с другой коллекцией (foreign key)

export interface FieldOption {
  value: string;
  label: string;
  color?: string; // e.g. 'cyan', 'emerald', 'amber', 'rose', 'purple', 'slate'
}

export interface CollectionField {
  name: string;              // Системное имя (latin lowercase, e.g. 'client_name')
  title: string;             // Человекочитаемый заголовок (e.g. 'Имя клиента')
  type: FieldType;
  required?: boolean;
  defaultValue?: any;
  options?: FieldOption[];   // Для select, multiSelect, status
  targetCollection?: string; // Для belongsTo
  targetLabelField?: string; // Поле для отображения в связанной коллекции
  description?: string;
  isSystem?: boolean;        // Системные поля (id, createdAt, updatedAt)
}

export interface Collection {
  name: string;              // Уникальный идентификатор коллекции, e.g. 'support_tickets'
  title: string;             // Название, e.g. 'Обращения и рекламации'
  description?: string;
  category?: string;         // Раздел в меню, e.g. '🏢 Пользовательские справочники'
  icon?: string;             // Lucide icon name, e.g. 'LifeBuoy', 'ShieldAlert'
  fields: CollectionField[];
  createdAt: string;
  updatedAt: string;
  system?: boolean;
}

export interface CollectionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [fieldName: string]: any;
}

export interface CollectionQueryParams {
  search?: string;
  filterField?: string;
  filterValue?: any;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
