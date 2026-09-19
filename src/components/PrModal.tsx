import React from 'react';
import { GitPullRequest, X, CheckCircle2, ShieldCheck, FileCode, Users, ArrowUpRight } from 'lucide-react';

interface PrModalProps {
  isOpen: boolean;
  onClose: () => void;
  prNumber: string;
}

export const PrModal: React.FC<PrModalProps> = ({ isOpen, onClose, prNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  Pull Request {prNumber}: feature/refund-endpoint
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
                  ✅ Open / Ready to merge
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                feature/refund-endpoint → main · Автор: Иван Петров & Billing-агент
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PR Checks Status Grid */}
        <div className="grid grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px]">CI/CD Пайплайн</span>
              <p className="font-semibold text-slate-200">28/28 тестов пройдены</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px]">Безопасность</span>
              <p className="font-semibold text-slate-200">PII маскирование OK</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px]">Ревью кода</span>
              <p className="font-semibold text-slate-200">2 одобрения (SecOps, Lead)</p>
            </div>
          </div>
        </div>

        {/* Changed Files Overview */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Затронутые модули и документация (4 файла):
          </h4>
          <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 font-mono text-xs overflow-hidden">
            <div className="p-2.5 flex items-center justify-between text-slate-300">
              <span>services/billing/saga.py</span>
              <span className="text-emerald-400">+42 / -8</span>
            </div>
            <div className="p-2.5 flex items-center justify-between text-slate-300">
              <span>docs/adr/ADR-042-refund-saga.md</span>
              <span className="text-emerald-400">+78 / -0</span>
            </div>
            <div className="p-2.5 flex items-center justify-between text-slate-300">
              <span>api/openapi/refund.yaml</span>
              <span className="text-emerald-400">+64 / -0</span>
            </div>
            <div className="p-2.5 flex items-center justify-between text-slate-300">
              <span>ui/src/components/RefundModal.tsx</span>
              <span className="text-emerald-400">+114 / -0</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            После вливания будет автоматически запущен деплой в staging
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
              Закрыть
            </button>
            <button
              onClick={() => {
                alert('Pull Request #4822 успешно влит в основную ветку main!');
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/30"
            >
              Влить Pull Request (Merge)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
