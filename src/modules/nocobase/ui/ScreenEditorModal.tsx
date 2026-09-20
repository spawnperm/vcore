import React, { useState } from 'react';
import { Collection } from '../database/types';
import { CustomScreenSchema, UiBlockSchema } from '../ui-schema/types';
import { X, Save, Layout, Plus, Trash2, CheckSquare, Square, Zap } from 'lucide-react';

interface ScreenEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  screen?: CustomScreenSchema;
  onSave: (screen: Omit<CustomScreenSchema, 'createdAt' | 'updatedAt'>) => void;
}

export const ScreenEditorModal: React.FC<ScreenEditorModalProps> = ({
  isOpen,
  onClose,
  collections,
  screen,
  onSave,
}) => {
  const [title, setTitle] = useState(screen?.title || '');
  const [id, setId] = useState(screen?.id || '');
  const [collectionName, setCollectionName] = useState(
    screen?.collectionName || (collections[0]?.name || '')
  );
  const [includeMetrics, setIncludeMetrics] = useState(
    screen?.blocks.some((b) => b.type === 'metrics') ?? true
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    screen?.blocks.find((b) => b.type === 'table')?.visibleFields || []
  );

  const currentCollection = collections.find((c) => c.name === collectionName);

  // When changing collection, reset selected fields
  const handleCollectionChange = (colName: string) => {
    setCollectionName(colName);
    const target = collections.find((c) => c.name === colName);
    if (target) {
      setSelectedFields(target.fields.filter((f) => f.name !== 'id').map((f) => f.name));
    }
  };

  if (!isOpen) return null;

  const toggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields((prev) => prev.filter((f) => f !== fieldName));
    } else {
      setSelectedFields((prev) => [...prev, fieldName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !collectionName) return;

    const cleanScreenId =
      id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
      `screen-${Date.now().toString(36)}`;

    const blocks: UiBlockSchema[] = [];

    // Optional Metrics block
    if (includeMetrics) {
      blocks.push({
        id: `blk-${cleanScreenId}-kpi`,
        type: 'metrics',
        title: `KPI показатели: ${title}`,
        collectionName,
        visibleFields: [],
        metrics: [
          {
            id: 'm-count',
            label: 'Всего записей',
            aggregationType: 'count',
            color: 'cyan',
            suffix: ' шт.',
          },
        ],
      });
    }

    // Main Table block
    blocks.push({
      id: `blk-${cleanScreenId}-tbl`,
      type: 'table',
      title: title,
      collectionName,
      visibleFields:
        selectedFields.length > 0
          ? selectedFields
          : currentCollection?.fields.map((f) => f.name) || [],
      defaultSortField: 'createdAt',
      defaultSortOrder: 'desc',
      canAdd: true,
      canEdit: true,
      canDelete: true,
    });

    onSave({
      id: cleanScreenId.startsWith('screen-') ? cleanScreenId : `screen-${cleanScreenId}`,
      title: title.trim(),
      section: '🏢 Пользовательские справочники',
      icon: currentCollection?.icon || 'Layout',
      collectionName,
      blocks,
      isCustom: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {screen ? 'Настройка экрана' : 'Конструктор экранов (@nocobase/client/ui-schema)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Декларативное описание блоков интерфейса, таблиц и аналитических метрик
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-3 flex items-center gap-2.5 text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Новый экран будет мгновенно встроен в навигационное меню портала и зарегистрирован в
              шине <b>NATS JetStream</b>.
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">
              Целевой справочник (Коллекция данных) <span className="text-rose-400">*</span>
            </label>
            <select
              value={collectionName}
              onChange={(e) => handleCollectionChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {collections.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.title} ({col.name}) • {col.fields.length} полей
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Заголовок экрана в меню <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!screen && !id) {
                    setId(`screen-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                  }
                }}
                placeholder="Например: Реестр договоров"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Идентификатор экрана (URL-id)</label>
              <input
                type="text"
                required
                value={id}
                disabled={Boolean(screen)}
                onChange={(e) => setId(e.target.value)}
                placeholder="screen-contracts"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Blocks Configuration */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">
              Компоновка блоков экрана (UI Schema Blocks)
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-metrics"
                checked={includeMetrics}
                onChange={(e) => setIncludeMetrics(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="chk-metrics" className="text-xs text-slate-300 cursor-pointer select-none">
                Включить верхний блок сводных KPI-метрик (Количество записей, агрегаты)
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Видимые колонки таблицы (Fields):
                </span>
                <span className="text-[10px] text-slate-500">
                  Выбрано {selectedFields.length} из {currentCollection?.fields.length || 0}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {currentCollection?.fields.map((f) => {
                  const isChecked = selectedFields.includes(f.name);
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => toggleField(f.name)}
                      className={`text-left p-2 rounded-lg flex items-center gap-2 transition-colors border ${
                        isChecked
                          ? 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-medium block truncate text-[11px]">{f.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono block">{f.type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
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
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-900/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Опубликовать экран</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
