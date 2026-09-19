import React, { useState, useEffect } from 'react';
import { Search, X, Layers, FileText, Monitor, Activity, ArrowRight } from 'lucide-react';
import { MindmapNode, DocItem, PortalScreen } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MindmapNode[];
  docs: DocItem[];
  screens: PortalScreen[];
  onSelectResult: (type: 'node' | 'doc' | 'screen', id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  docs,
  screens,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle will be handled by parent or shortcut
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNodes = nodes.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredScreens = screens.filter((s) =>
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Быстрый переход: Billing, Saga, ADR-042, Заказы, Kafka..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-800/60 text-xs">
          {/* Nodes */}
          {filteredNodes.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Узлы реализации (План)
              </span>
              {filteredNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    onSelectResult('node', n.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{n.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{n.progress}%</span>
                </button>
              ))}
            </div>
          )}

          {/* Docs */}
          {filteredDocs.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Документация & Спецификации
              </span>
              {filteredDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectResult('doc', d.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{d.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{d.type.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Screens */}
          {filteredScreens.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Экраны интерфейса (Вид портала)
              </span>
              {filteredScreens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectResult('screen', s.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{s.section} → {s.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
