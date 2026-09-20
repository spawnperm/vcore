import React, { useState, useEffect } from 'react';
import { Collection, CollectionRecord } from '../database/types';
import { X, Save, CheckCircle2, Zap } from 'lucide-react';

interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  record?: CollectionRecord; // если передано - редактирование, иначе создание
  onSave: (data: Record<string, any>) => void;
}

export const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  isOpen,
  onClose,
  collection,
  record,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    } else {
      // Initialize defaults
      const defaults: Record<string, any> = {};
      collection.fields.forEach((f) => {
        if (f.defaultValue !== undefined) {
          defaults[f.name] = f.defaultValue;
        } else if (f.type === 'boolean') {
          defaults[f.name] = false;
        } else if (f.type === 'number' || f.type === 'integer' || f.type === 'money') {
          defaults[f.name] = 0;
        } else if (f.options && f.options.length > 0) {
          defaults[f.name] = f.options[0].value;
        } else {
          defaults[f.name] = '';
        }
      });
      setFormData(defaults);
    }
    setErrors({});
  }, [record, collection, isOpen]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    collection.fields.forEach((f) => {
      if (f.isSystem) return;
      if (f.required) {
        const val = formData[f.name];
        if (val === undefined || val === null || val === '') {
          newErrors[f.name] = `Поле «${f.title}» обязательно для заполнения`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSave(formData);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  const editableFields = collection.fields.filter((f) => !f.isSystem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {record ? 'Редактирование записи' : 'Новая запись в справочнике'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Таблица: <span className="text-cyan-400">{collection.title}</span> ({collection.name})
            </p>
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
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg p-2.5 flex items-center gap-2 text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px]">
              Событие будет автоматически реплицировано в <b>NATS JetStream</b> на топик{' '}
              <code className="bg-cyan-900/60 px-1 py-0.5 rounded text-[10px] font-mono">
                records.v1.{collection.name}.{record ? 'updated' : 'created'}
              </code>
            </span>
          </div>

          <div className="space-y-3.5">
            {editableFields.map((field) => {
              const error = errors[field.name];
              const value = formData[field.name];

              return (
                <div key={field.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300 flex items-center gap-1">
                      <span>{field.title}</span>
                      {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">{field.type}</span>
                  </div>

                  {field.description && (
                    <p className="text-[10px] text-slate-400">{field.description}</p>
                  )}

                  {/* Render based on field type */}
                  {field.type === 'text' ? (
                    <textarea
                      rows={3}
                      value={value || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={`Введите ${field.title.toLowerCase()}...`}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 ${
                        error
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    />
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`chk-${field.name}`}
                        checked={Boolean(value)}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                      />
                      <label
                        htmlFor={`chk-${field.name}`}
                        className="text-xs text-slate-300 select-none cursor-pointer"
                      >
                        {Boolean(value) ? 'Включено / Да' : 'Отключено / Нет'}
                      </label>
                    </div>
                  ) : field.type === 'select' || field.type === 'status' ? (
                    <select
                      value={value || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 ${
                        error
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'money' || field.type === 'number' || field.type === 'integer' ? (
                    <div className="relative">
                      <input
                        type="number"
                        step={field.type === 'integer' ? '1' : 'any'}
                        value={value !== undefined ? value : ''}
                        onChange={(e) => handleChange(field.name, Number(e.target.value))}
                        className={`w-full bg-slate-950 border rounded-lg pl-3 pr-8 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 font-mono ${
                          error
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
                        }`}
                      />
                      {field.type === 'money' && (
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                          ₽
                        </span>
                      )}
                    </div>
                  ) : (
                    <input
                      type={
                        field.type === 'email'
                          ? 'email'
                          : field.type === 'date'
                          ? 'date'
                          : field.type === 'datetime'
                          ? 'datetime-local'
                          : 'text'
                      }
                      value={value || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={`Введите ${field.title.toLowerCase()}...`}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 ${
                        error
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    />
                  )}

                  {error && <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Публикация в NATS...' : record ? 'Сохранить изменения' : 'Создать запись'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
