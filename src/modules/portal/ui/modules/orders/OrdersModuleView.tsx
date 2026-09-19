import React from 'react';
import { ViewMode } from '../../shell/PortalTopBar';
import { Order } from '../../../domain/orders/model';
import { CreditCard, Download, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface OrdersModuleViewProps {
  orders: Order[];
  viewMode: ViewMode;
  onOpenRefundModal: (order: Order) => void;
}

export const OrdersModuleView: React.FC<OrdersModuleViewProps> = ({
  orders,
  viewMode,
  onOpenRefundModal,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Реестр заказов покупателей (Sales Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: Order
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Всего {orders.length} заказов в текущем отчётном периоде
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode !== 'current' && (
            <div className={viewMode === 'diff' ? 'ring-2 ring-emerald-400 rounded-lg p-0.5' : ''}>
              <button
                onClick={() => onOpenRefundModal(orders[0])}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>+ Оформить возврат (Saga)</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1 rounded">
                  NEW
                </span>
              </button>
            </div>
          )}

          <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт Excel</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-4 flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Номер заказа</th>
              <th className="p-3">Клиент</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Статус оплаты</th>
              {viewMode !== 'current' && (
                <th
                  className={`p-3 ${
                    viewMode === 'diff' ? 'text-emerald-400 font-bold bg-emerald-950/40' : ''
                  }`}
                >
                  Статус возврата 🆕
                </th>
              )}
              <th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono font-semibold text-cyan-300">
                  {order.number}
                </td>
                <td className="p-3">
                  <span className="font-medium">{order.clientName}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Создан: {order.createdAt}
                  </span>
                </td>
                <td className="p-3 font-mono font-medium">{order.total.format()}</td>
                <td className="p-3">
                  {order.status === 'PAID' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Оплачен
                    </span>
                  ) : order.status === 'REFUNDED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Возвращён
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                      {order.status}
                    </span>
                  )}
                </td>

                {viewMode !== 'current' && (
                  <td className="p-3">
                    {order.refundState === 'PROCESSING' ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1 w-fit ${
                          viewMode === 'diff'
                            ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Saga ({order.refundProgress || 60}%)
                      </span>
                    ) : order.refundState === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-[11px] font-mono flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Закрыта 100%
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                )}

                <td className="p-3 text-right">
                  {order.canInitiateRefund() && viewMode !== 'current' ? (
                    <button
                      onClick={() => onOpenRefundModal(order)}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                    >
                      Возврат →
                    </button>
                  ) : (
                    <button className="text-slate-400 hover:text-slate-200">
                      Подробнее
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
