import React, { useState, useMemo } from 'react';
import { DocItem, DocVersion } from '../../../types';
import { computeLineDiff } from '../../../utils/diffUtils';
import {
  GitCompare,
  Columns,
  AlignJustify,
  ArrowLeft,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface DocDiffViewerProps {
  doc: DocItem;
  onClose: () => void;
  onRestoreVersion: (content: string, versionNumber: string) => void;
}

export const DocDiffViewer: React.FC<DocDiffViewerProps> = ({
  doc,
  onClose,
  onRestoreVersion,
}) => {
  const versions: DocVersion[] = useMemo(() => {
    const list = [...(doc.versions || [])];
    return list;
  }, [doc.versions]);

  // Special options: versions + "current" (the live draft/content of the doc)
  const currentDraftVersion: DocVersion = useMemo(() => {
    return {
      id: 'current-working-draft',
      versionNumber: `${doc.version || 'текущий'} (рабочий черновик)`,
      createdAt: doc.lastModified || 'сейчас',
      createdBy: doc.author,
      summary: 'Текущее рабочее состояние документа в редакторе',
      content: doc.content,
      status: doc.status,
    };
  }, [doc]);

  // By default, compare previous version with the latest/current version
  const [versionAId, setVersionAId] = useState<string>(() => {
    if (versions.length >= 2) {
      return versions[versions.length - 2].id;
    }
    if (versions.length === 1) {
      return versions[0].id;
    }
    return 'current-working-draft';
  });

  const [versionBId, setVersionBId] = useState<string>(() => {
    if (versions.length >= 1) {
      return versions[versions.length - 1].id;
    }
    return 'current-working-draft';
  });

  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState('');

  // Resolve version objects
  const versionA = useMemo(() => {
    if (versionAId === 'current-working-draft') return currentDraftVersion;
    return versions.find((v) => v.id === versionAId) || currentDraftVersion;
  }, [versionAId, versions, currentDraftVersion]);

  const versionB = useMemo(() => {
    if (versionBId === 'current-working-draft') return currentDraftVersion;
    return versions.find((v) => v.id === versionBId) || currentDraftVersion;
  }, [versionBId, versions, currentDraftVersion]);

  // Compute line-by-line diff
  const diff = useMemo(() => {
    return computeLineDiff(versionA.content, versionB.content);
  }, [versionA.content, versionB.content]);

  const handleSwap = () => {
    const temp = versionAId;
    setVersionAId(versionBId);
    setVersionBId(temp);
  };

  const handleRestore = (targetVer: DocVersion) => {
    if (
      window.confirm(
        `Восстановить содержимое документа из версии «${targetVer.versionNumber}»? Текущие несохранённые правки будут заменены.`
      )
    ) {
      onRestoreVersion(targetVer.content, targetVer.versionNumber);
      setRestoreFeedback(`Восстановлено из ${targetVer.versionNumber}`);
      setTimeout(() => setRestoreFeedback(''), 3000);
    }
  };

  const handleCopyUnified = () => {
    const text = diff.unified
      .map((l) => {
        const prefix = l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' ';
        return `${prefix} ${l.content}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Вернуться к чтению документа"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Назад</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 truncate">
            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <GitCompare className="w-4 h-4" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100 truncate">
                  Сравнение версий (Diff): {doc.title.split(':')[0]}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                  {versions.length} версий в истории
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {restoreFeedback && (
            <span className="text-xs text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
              {restoreFeedback}
            </span>
          )}

          {/* View Mode Toggle: Split / Unified */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'split'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Раздельный вид (две колонки)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'unified'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Объединенный построчный вид"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Unified</span>
            </button>
          </div>

          <button
            onClick={handleCopyUnified}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
            title="Скопировать Git patch diff"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Version Comparison Selector Bar */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Base Version (A / Before) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Базовая версия (A):</span>
            <select
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            >
              <option value="current-working-draft">Текущий черновик (в памяти)</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionNumber} — {v.summary.substring(0, 35)}... ({v.createdAt})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Поменять местами базовую и целевую версии"
          >
            <GitCompare className="w-3.5 h-3.5" />
          </button>

          {/* Target Version (B / After) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Целевая версия (B):</span>
            <select
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            >
              <option value="current-working-draft">Текущий черновик (в памяти)</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionNumber} — {v.summary.substring(0, 35)}... ({v.createdAt})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Stats Badges & Restore Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
              <Plus className="w-3 h-3" />
              {diff.additions} строк
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center gap-1 font-semibold">
              <Minus className="w-3 h-3" />
              {diff.deletions} строк
            </span>
          </div>

          {versionAId !== 'current-working-draft' && (
            <button
              onClick={() => handleRestore(versionA)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
              title={`Откатить рабочий документ до ${versionA.versionNumber}`}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Восстановить {versionA.versionNumber}</span>
            </button>
          )}

          {versionBId !== 'current-working-draft' && versionBId !== versionAId && (
            <button
              onClick={() => handleRestore(versionB)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
              title={`Откатить рабочий документ до ${versionB.versionNumber}`}
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Восстановить {versionB.versionNumber}</span>
            </button>
          )}
        </div>
      </div>

      {/* Version Headers Meta (Summary of both selected versions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-900/30 border-b border-slate-800/80 text-[11px] px-6 py-2 gap-4">
        <div className="flex items-center justify-between text-slate-400">
          <div className="truncate">
            <span className="text-rose-400 font-bold font-mono">[-] Было: </span>
            <span className="font-semibold text-slate-200">{versionA.versionNumber}</span>
            <span className="ml-2 text-slate-400">({versionA.createdBy}, {versionA.createdAt})</span>
          </div>
          <span className="italic text-slate-500 truncate max-w-xs ml-2">{versionA.summary}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <div className="truncate">
            <span className="text-emerald-400 font-bold font-mono">[+] Стало: </span>
            <span className="font-semibold text-slate-200">{versionB.versionNumber}</span>
            <span className="ml-2 text-slate-400">({versionB.createdBy}, {versionB.createdAt})</span>
          </div>
          <span className="italic text-slate-500 truncate max-w-xs ml-2">{versionB.summary}</span>
        </div>
      </div>

      {/* Diff Content Area */}
      <div className="flex-1 overflow-auto font-mono text-xs select-text">
        {diff.additions === 0 && diff.deletions === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-slate-300">Версии идентичны</p>
            <p className="text-xs text-slate-500 mt-1">
              Между «{versionA.versionNumber}» и «{versionB.versionNumber}» нет расхождений в тексте.
            </p>
          </div>
        ) : viewMode === 'split' ? (
          /* Split / Side-by-Side View */
          <div className="min-w-full divide-y divide-slate-800/60">
            {diff.sideBySide.map((row) => (
              <div key={row.id} className="grid grid-cols-2 divide-x divide-slate-800 hover:bg-slate-900/30">
                {/* Left (Version A) */}
                <div
                  className={`flex items-start px-2 py-0.5 min-h-[22px] leading-5 ${
                    row.left?.type === 'removed'
                      ? 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="w-10 shrink-0 text-[10px] text-slate-600 select-none text-right pr-2">
                    {row.left?.lineNum || ''}
                  </span>
                  <span className="w-4 shrink-0 text-center select-none text-rose-400 font-bold">
                    {row.left?.type === 'removed' ? '-' : ''}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                    {row.left?.content || ''}
                  </span>
                </div>

                {/* Right (Version B) */}
                <div
                  className={`flex items-start px-2 py-0.5 min-h-[22px] leading-5 ${
                    row.right?.type === 'added'
                      ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="w-10 shrink-0 text-[10px] text-slate-600 select-none text-right pr-2">
                    {row.right?.lineNum || ''}
                  </span>
                  <span className="w-4 shrink-0 text-center select-none text-emerald-400 font-bold">
                    {row.right?.type === 'added' ? '+' : ''}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                    {row.right?.content || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Unified View */
          <div className="min-w-full divide-y divide-slate-900">
            {diff.unified.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';

              return (
                <div
                  key={`u-${idx}`}
                  className={`flex items-start px-3 py-0.5 leading-5 hover:bg-slate-900/40 ${
                    isAdded
                      ? 'bg-emerald-950/35 text-emerald-200 border-l-2 border-emerald-500'
                      : isRemoved
                      ? 'bg-rose-950/35 text-rose-200 border-l-2 border-rose-500'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="w-10 shrink-0 text-[10px] text-slate-600 select-none text-right pr-2">
                    {line.lineNumA || ''}
                  </span>
                  <span className="w-10 shrink-0 text-[10px] text-slate-600 select-none text-right pr-2 border-r border-slate-800 mr-2">
                    {line.lineNumB || ''}
                  </span>
                  <span
                    className={`w-5 shrink-0 text-center select-none font-bold ${
                      isAdded ? 'text-emerald-400' : isRemoved ? 'text-rose-400' : 'text-slate-600'
                    }`}
                  >
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                    {line.content}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
