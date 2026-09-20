import React from 'react';
import { DocItem, DocVersion } from '../../../types';
import {
  History,
  X,
  Plus,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Eye,
} from 'lucide-react';

interface DocVersionsDrawerProps {
  isOpen: boolean;
  doc: DocItem;
  onClose: () => void;
  onOpenCreateVersion: () => void;
  onOpenDiff: () => void;
  onRestoreVersion: (content: string, versionNumber: string) => void;
}

export const DocVersionsDrawer: React.FC<DocVersionsDrawerProps> = ({
  isOpen,
  doc,
  onClose,
  onOpenCreateVersion,
  onOpenDiff,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  const versions = doc.versions || [];

  const getStatusBadge = (status: DocVersion['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            утверждён
          </span>
        );
      case 'review':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            на ревью
          </span>
        );
      case 'deprecated':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            устарело
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            черновик
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                История версий документа
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
                {doc.title.split(':')[0]} ({versions.length} версий)
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

        {/* Action Bar */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenDiff();
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Сравнить версии (Diff)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCreateVersion();
            }}
            className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            title="Зафиксировать новую версию"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Новая версия</span>
          </button>
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {/* Current Working Draft entry */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-cyan-800/60 relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-cyan-400">
                  {doc.version || 'текущий'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Рабочий черновик
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{doc.lastModified}</span>
            </div>
            <p className="text-slate-300 text-xs mb-2">
              Текущее редактируемое состояние документа.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                {doc.author}
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenDiff();
                }}
                className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
              >
                <GitCompare className="w-3 h-3" />
                Сравнить с базой
              </button>
            </div>
          </div>

          {/* Historical versions */}
          <div className="pt-2">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Сохранённые версии ({versions.length})
            </h4>

            {versions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>Нет зафиксированных версий</p>
                <p className="text-[11px] mt-1">
                  Нажмите «+ Новая версия», чтобы создать первый снимок.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions
                  .slice()
                  .reverse()
                  .map((ver, idx) => (
                    <div
                      key={ver.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-slate-100">
                          {ver.versionNumber}
                        </span>
                        {getStatusBadge(ver.status)}
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed mb-2.5">
                        {ver.summary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{ver.createdBy}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0">
                          <Calendar className="w-3 h-3" />
                          {ver.createdAt}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Восстановить версию «${ver.versionNumber}» в рабочий документ?`
                              )
                            ) {
                              onRestoreVersion(ver.content, ver.versionNumber);
                              onClose();
                            }
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] flex items-center gap-1 transition-colors"
                          title="Откатить текущий документ до этой версии"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>Восстановить</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenDiff();
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <GitCompare className="w-3 h-3" />
                          <span>Diff</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
