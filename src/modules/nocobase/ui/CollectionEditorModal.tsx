import React, { useState } from 'react';
import { Collection, CollectionField, FieldType } from '../database/types';
import { X, Plus, Trash2, Save, Database, ShieldAlert, Sparkles, Zap } from 'lucide-react';

interface CollectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection; // если передан — редактирование, если нет — создание нового
  onSave: (collection: Omit<Collection, 'createdAt' | 'updatedAt'>) => void;
}

const AVAILABLE_TYPES: { type: FieldType; label: string; desc: string }[] = [
  { type: 'string', label: 'Текст (однострочный)', desc: 'Имена, названия, номера' },
  { type: 'text', label: 'Текст (многострочный)', desc: 'Описания, примечания' },
  { type: 'money', label: 'Деньги / Сумма (₽)', desc: 'Финансовые показатели с валютой' },
  { type: 'integer', label: 'Целое число', desc: 'Количество, счетчики' },
  { type: 'number', label: 'Дробное число', desc: 'Коэффициенты, проценты' },
  { type: 'boolean', label: 'Флаг (Да/Нет)', desc: 'Переключатель (Switch)' },
  { type: 'select', label: 'Выпадающий список', desc: 'Выбор из фиксированных опций' },
  { type: 'status', label: 'Статус (Бейдж)', desc: 'Цветные бейджи жизненного цикла' },
  { type: 'date', label: 'Дата', desc: 'Календарная дата' },
  { type: 'datetime', label: 'Дата и время', desc: 'Точный таймштамп' },
  { type: 'email', label: 'Email', desc: 'Электронная почта' },
  { type: 'phone', label: 'Телефон', desc: 'Номер телефона' },
];

export const CollectionEditorModal: React.FC<CollectionEditorModalProps> = ({
  isOpen,
  onClose,
  collection,
  onSave,
}) => {
  const [title, setTitle] = useState(collection?.title || '');
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [category, setCategory] = useState(collection?.category || '🏢 Пользовательские справочники');
  const [icon, setIcon] = useState(collection?.icon || 'Database');
  const [fields, setFields] = useState<CollectionField[]>(
    collection?.fields || [
      { name: 'code', title: 'Код / Номер', type: 'string', required: true },
      { name: 'name', title: 'Наименование', type: 'string', required: true },
    ]
  );

  // New Field input state
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldTitle, setNewFieldTitle] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptionsRaw, setNewFieldOptionsRaw] = useState('Новый:cyan, В работе:amber, Завершено:emerald');

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newFieldTitle.trim()) return;
    const cleanName =
      newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      `field_${Date.now().toString(36)}`;

    // Parse options if select or status
    let options = undefined;
    if (newFieldType === 'select' || newFieldType === 'status') {
      options = newFieldOptionsRaw
        .split(',')
        .map((opt) => {
          const parts = opt.trim().split(':');
          const label = parts[0]?.trim();
          const color = parts[1]?.trim() || 'cyan';
          const value = label.toLowerCase().replace(/\s+/g, '_');
          return { label, value, color };
        })
        .filter((o) => Boolean(o.label));
    }

    const newField: CollectionField = {
      name: cleanName,
      title: newFieldTitle.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options,
    };

    setFields((prev) => [...prev, newField]);
    setIsAddingField(false);
    setNewFieldName('');
    setNewFieldTitle('');
    setNewFieldType('string');
    setNewFieldRequired(false);
  };

  const handleRemoveField = (fieldName: string) => {
    setFields((prev) => prev.filter((f) => f.name !== fieldName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanColName =
      name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      `col_${Date.now().toString(36)}`;

    onSave({
      name: cleanColName,
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      fields,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {collection ? 'Редактирование справочника' : 'Конструктор справочника (@nocobase/database)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Настройка схемы сущности и пользовательских полей с репликацией в NATS JetStream
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-3 flex items-center gap-2.5 text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              При сохранении метаданные схемы будут зафиксированы в NATS KV Store{' '}
              <code className="bg-cyan-900/50 px-1 py-0.5 rounded font-mono text-[10px]">
                $KV.portal_schemas
              </code>{' '}
              и разосланы потребителям по шине событий.
            </span>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Название справочника <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!collection && !name) {
                    // Auto-generate latin key
                    setName(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '_')
                        .replace(/_+/g, '_')
                    );
                  }
                }}
                placeholder="Например: Гарантийные рекламации"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Системный ключ таблицы (Коллекция) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(collection)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="warranty_claims"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Описание назначения</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое назначение справочника для сотрудников"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Fields Configuration Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Пользовательские поля (Custom Fields)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 font-mono border border-cyan-800">
                    {fields.length}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Типы данных соответствуют модели NocoBase Database Engine
                </p>
              </div>

              {!isAddingField && (
                <button
                  type="button"
                  onClick={() => setIsAddingField(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить поле</span>
                </button>
              )}
            </div>

            {/* Add Field Sub-Form */}
            {isAddingField && (
              <div className="bg-slate-950/80 border border-cyan-800/80 rounded-xl p-3.5 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs">
                    Новое поле для справочника
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingField(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Заголовок поля (рус.)
                    </label>
                    <input
                      type="text"
                      value={newFieldTitle}
                      onChange={(e) => {
                        setNewFieldTitle(e.target.value);
                        if (!newFieldName) {
                          setNewFieldName(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, '_')
                              .replace(/_+/g, '_')
                          );
                        }
                      }}
                      placeholder="Например: Срок исполнения"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Системное имя (field_name)
                    </label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="due_date"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Тип данных
                    </label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {AVAILABLE_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label} ({t.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="chk-req"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label
                      htmlFor="chk-req"
                      className="text-xs text-slate-300 cursor-pointer select-none"
                    >
                      Обязательное поле (Required)
                    </label>
                  </div>
                </div>

                {(newFieldType === 'select' || newFieldType === 'status') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Варианты выбора (Формат: Текст:Цвет через запятую)
                    </label>
                    <input
                      type="text"
                      value={newFieldOptionsRaw}
                      onChange={(e) => setNewFieldOptionsRaw(e.target.value)}
                      placeholder="Новый:cyan, В работе:amber, Завершено:emerald, Отклонено:rose"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Цвета: cyan, emerald, amber, rose, purple, slate
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingField(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Добавить в схему
                  </button>
                </div>
              </div>
            )}

            {/* List of Fields */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 rounded-full bg-cyan-500" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{field.title}</span>
                        {field.required && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                            required
                          </span>
                        )}
                        {field.isSystem && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            system
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {field.name} • {field.type}
                        {field.options && ` • [${field.options.map((o) => o.label).join(', ')}]`}
                      </div>
                    </div>
                  </div>

                  {!field.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.name)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить схему справочника</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
