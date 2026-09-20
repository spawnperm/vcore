import React, { useState, useMemo } from 'react';
import { Collection, CollectionRecord } from '../database/types';
import { UiBlockSchema } from '../ui-schema/types';
import {
  Search,
  Plus,
  ArrowUpDown,
  Trash2,
  Edit2,
  Check,
  X,
  Database,
  Filter,
} from 'lucide-react';

interface DynamicTableBlockProps {
  block: UiBlockSchema;
  collection: Collection;
  records: CollectionRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: CollectionRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const DynamicTableBlock: React.FC<DynamicTableBlockProps> = ({
  block,
  collection,
  records,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>(block.defaultSortField || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(block.defaultSortOrder || 'desc');
  const [filterField, setFilterField] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Visible fields configured in the UI schema
  const visibleFields = useMemo(() => {
    if (block.visibleFields && block.visibleFields.length > 0) {
      return block.visibleFields
        .map((name) => collection.fields.find((f) => f.name === name))
        .filter(Boolean) as typeof collection.fields;
    }
    return collection.fields.filter((f) => f.name !== 'id');
  }, [block.visibleFields, collection.fields]);

  // Filtering & Sorting
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((r) =>
        Object.values(r).some((val) => val && String(val).toLowerCase().includes(q))
      );
    }

    if (sortField) {
      const order = sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? order : -order;
      });
    }

    return result;
  }, [records, search, sortField, sortOrder]);

  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const paginatedRecords = processedRecords.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldName);
      setSortOrder('asc');
    }
  };

  const renderCellValue = (record: CollectionRecord, fieldName: string) => {
    const val = record[fieldName];
    const field = collection.fields.find((f) => f.name === fieldName);

    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-600 font-mono">—</span>;
    }

    if (field?.type === 'money') {
      return (
        <span className="font-mono font-semibold text-slate-100">
          {Number(val).toLocaleString('ru-RU')} ₽
        </span>
      );
    }

    if (field?.type === 'boolean') {
      return val ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
          <Check className="w-3.5 h-3.5" /> Да
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <X className="w-3.5 h-3.5" /> Нет
        </span>
      );
    }

    if (field?.type === 'status' || field?.type === 'select') {
      const opt = field.options?.find((o) => o.value === val);
      const label = opt ? opt.label : String(val);
      const color = opt?.color || 'slate';

      const colorMap: Record<string, string> = {
        cyan: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        emerald: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        amber: 'bg-amber-950 text-amber-300 border-amber-800',
        rose: 'bg-rose-950 text-rose-300 border-rose-800',
        purple: 'bg-purple-950 text-purple-300 border-purple-800',
        slate: 'bg-slate-800 text-slate-300 border-slate-700',
      };

      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            colorMap[color] || colorMap.slate
          }`}
        >
          {label}
        </span>
      );
    }

    if (field?.type === 'datetime' || field?.type === 'date') {
      try {
        const d = new Date(val);
        return (
          <span className="text-[11px] text-slate-400 font-mono">
            {d.toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: field.type === 'datetime' ? '2-digit' : undefined,
              minute: field.type === 'datetime' ? '2-digit' : undefined,
            })}
          </span>
        );
      } catch {
        return <span className="text-slate-300">{String(val)}</span>;
      }
    }

    return <span className="text-slate-200 truncate max-w-[200px] block">{String(val)}</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <div>
            <h4 className="font-bold text-slate-200 text-sm">{block.title}</h4>
            <p className="text-[10px] text-slate-500 font-mono">
              Справочник: {collection.name} • Всего записей: {processedRecords.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по записям..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 lg:w-56"
            />
          </div>

          {/* Add Record Button */}
          {block.canAdd !== false && (
            <button
              onClick={onAddRecord}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить запись</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold select-none">
            <tr>
              {visibleFields.map((field) => (
                <th
                  key={field.name}
                  onClick={() => toggleSort(field.name)}
                  className="px-3.5 py-2.5 cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{field.title}</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortField === field.name ? 'text-cyan-400 opacity-100' : 'opacity-30'
                      }`}
                    />
                  </div>
                </th>
              ))}
              <th className="px-3.5 py-2.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleFields.length + 1}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Записей не найдено. Нажмите «Добавить запись» для создания.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {visibleFields.map((field) => (
                    <td key={field.name} className="px-3.5 py-2.5 whitespace-nowrap">
                      {renderCellValue(record, field.name)}
                    </td>
                  ))}
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      {block.canEdit !== false && (
                        <button
                          onClick={() => onEditRecord(record)}
                          title="Редактировать"
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {block.canDelete !== false && (
                        <button
                          onClick={() => {
                            if (window.confirm('Удалить эту запись из справочника?')) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          title="Удалить"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Страница {page} из {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Назад
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
