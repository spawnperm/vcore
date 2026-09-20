import React, { useState } from 'react';
import { X, CreditCard, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Order } from '../../../domain/orders/model';
import { Money } from '../../../domain/common/types';

interface RefundSagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order;
  onConfirm: (orderId: string, orderNumber: string, amount: number, reason: string) => void;
  isExecuting?: boolean;
}

export const RefundSagaModal: React.FC<RefundSagaModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  isExecuting = false,
}) => {
  const defaultAmount = order ? order.total.amount.toString() : '14200';
  const defaultNumber = order ? order.number : '#ORD-98421';
  const defaultId = order ? order.id : 'ord-1';

  const [amount, setAmount] = useState(defaultAmount);
  const [reason, setReason] = useState('Возврат товара надлежащего качества');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 14200;
    onConfirm(defaultId, defaultNumber, numAmount, reason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">
                Оформление возврата: {defaultNumber}
              </h4>
              <p className="text-[11px] text-slate-400">
                Запуск распределённого оркестратора Saga (Order → Bank → NATS JetStream → Notify)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Сумма возврата (₽)
            </label>
            <input
              type="number"
              disabled={isExecuting}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Причина возврата
            </label>
            <input
              type="text"
              disabled={isExecuting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            />
          </div>

          {/* DDD Architecture pipeline overview */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px]">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-2">
              Цепочка распределённых шагов (Saga Pipeline):
            </span>
            <div className="flex items-center gap-1.5 text-slate-300 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">1. Валидация</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">2. Эквайер банк</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">3. Ledger баланс</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">4. NATS JetStream</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">5. Уведомление</span>
            </div>
          </div>

          {isExecuting && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-800 rounded-xl flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <div>
                <span className="text-cyan-300 font-mono font-medium block">
                  Оркестратор Saga выполняет распределённые транзакции...
                </span>
                <span className="text-[10px] text-cyan-400">
                  Публикация событий в subject orders.v1.refund (NATS JetStream)
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isExecuting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-900/40 flex items-center gap-2 disabled:opacity-60"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Идёт проведение...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Запустить сагу возврата</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
