import React, { useState } from 'react';
import { DocItem, DocVersion } from '../../../types';
import {
  GitCommit,
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  Tag,
  User,
  Info,
} from 'lucide-react';

interface CreateVersionModalProps {
  isOpen: boolean;
  doc: DocItem;
  onClose: () => void;
  onCreateVersion: (newVersion: DocVersion) => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  doc,
  onClose,
  onCreateVersion,
}) => {
  // Suggest next version
  const suggestNextVersion = (): string => {
    const existing = doc.versions || [];
    if (existing.length === 0) {
      return doc.version || 'v1.0';
    }
    const last = existing[existing.length - 1].versionNumber;
    const match = last.match(/v?(\d+)\.(\d+)(.*)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      return `v${major}.${minor + 1}${doc.status === 'draft' ? '-draft' : ''}`;
    }
    return `v${existing.length + 1}.0`;
  };

  const [versionNumber, setVersionNumber] = useState(suggestNextVersion);
  const [createdBy, setCreatedBy] = useState('Иван Петров (Архитектор)');
  const [status, setStatus] = useState<DocVersion['status']>(doc.status || 'draft');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setError('Укажите номер версии (например, v1.0 или v0.5-draft)');
      return;
    }
    if (!summary.trim()) {
      setError('Укажите краткое описание изменений для этой версии');
      return;
    }

    const newVersion: DocVersion = {
      id: `ver-${doc.id}-${Date.now()}`,
      versionNumber: versionNumber.trim(),
      createdAt: new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdBy: createdBy.trim() || 'Пользователь',
      summary: summary.trim(),
      content: doc.content,
      status,
    };

    onCreateVersion(newVersion);
    onClose();
  };

  const setQuickVersion = (tag: string) => {
    setVersionNumber(tag);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <GitCommit className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Зафиксировать версию ADR
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
                {doc.title.split(':')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Version Number & Quick tags */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Номер версии <span className="text-rose-400">*</span></span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setQuickVersion('v1.0-approved')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  v1.0
                </button>
                <button
                  type="button"
                  onClick={() => setQuickVersion('v1.1-review')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  v1.1
                </button>
                <button
                  type="button"
                  onClick={() => setQuickVersion('v2.0-major')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  v2.0
                </button>
              </div>
            </label>
            <input
              type="text"
              value={versionNumber}
              onChange={(e) => {
                setVersionNumber(e.target.value);
                setError('');
              }}
              placeholder="e.g. v1.0, v0.5-draft, v2.0-nats"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Author and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Автор версии
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocVersion['status'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="draft">🔄 Черновик (draft)</option>
                <option value="review">🔍 На ревью (review)</option>
                <option value="approved">✅ Утверждён (approved)</option>
                <option value="deprecated">⛔ Устарело (deprecated)</option>
              </select>
            </div>
          </div>

          {/* Changelog / Summary */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Описание изменений (Changelog summary) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setError('');
              }}
              placeholder="Что изменилось в этом архитектурном решении? (например: замена двухфазного коммита на Saga Orchestrator, фиксация таймаутов, аудит PII)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />
          </div>

          {/* Snapshot Info Box */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Снимок документа: </span>
              Текущее содержимое файла ({doc.content.split('\n').length} строк) будет сохранено как неизменяемый снимок версии. Вы всегда сможете сравнить его через Diff или восстановить.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Зафиксировать версию</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
