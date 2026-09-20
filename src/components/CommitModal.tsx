import React, { useState } from 'react';
import { Package, X, CheckCircle2, GitBranch, Sparkles, FileCode } from 'lucide-react';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string) => void;
  branch: string;
}

export const CommitModal: React.FC<CommitModalProps> = ({
  isOpen,
  onClose,
  onCommit,
  branch,
}) => {
  const [message, setMessage] = useState('feat(billing): implement Saga orchestrator for refunds and ADR-042');
  const [stagedFiles] = useState([
    { path: 'services/billing/saga.py', status: 'modified', additions: '+42', deletions: '-8' },
    { path: 'docs/adr/ADR-042-refund-saga.md', status: 'added', additions: '+78', deletions: '0' },
    { path: 'services/gateway/routes.yaml', status: 'modified', additions: '+12', deletions: '-2' },
    { path: 'ui/src/pages/BillingRefund.tsx', status: 'added', additions: '+114', deletions: '0' },
  ]);

  if (!isOpen) return null;

  const handleCommit = () => {
    if (!message.trim()) return;
    onCommit(message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Зафиксировать коммит (Commit)
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ветка: {branch}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Сообщение коммита:</label>
              <button
                onClick={() => setMessage('feat(billing): orchestrate refund transaction via NATS JetStream and Notify service')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Сгенерировать AI
              </button>
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">
                Подготовленные файлы ({stagedFiles.length}):
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Git Staging</span>
            </div>
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-950/60 overflow-hidden max-h-48 overflow-y-auto">
              {stagedFiles.map((file) => (
                <div key={file.path} className="p-2.5 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate text-slate-200">{file.path}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] shrink-0">
                    <span className="text-emerald-400">{file.additions}</span>
                    <span className="text-rose-400">{file.deletions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-slate-400 text-xs">Агенты проверят CI/CD тесты после пуша</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
              Отмена
            </button>
            <button
              onClick={handleCommit}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-900/30"
            >
              Зафиксировать и запушить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
