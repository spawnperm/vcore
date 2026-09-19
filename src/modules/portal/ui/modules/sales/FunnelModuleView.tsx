import React from 'react';
import { FunnelDeal } from '../../../domain/sales/model';
import { TrendingUp, User, DollarSign } from 'lucide-react';

interface FunnelModuleViewProps {
  deals: FunnelDeal[];
}

export const FunnelModuleView: React.FC<FunnelModuleViewProps> = ({ deals }) => {
  const stages: { id: FunnelDeal['stage']; title: string; color: string }[] = [
    { id: 'lead', title: 'Новые лиды', color: 'border-slate-700 bg-slate-900/60' },
    { id: 'qualification', title: 'Квалификация', color: 'border-cyan-900 bg-cyan-950/20' },
    { id: 'proposal', title: 'Коммерческое предложение', color: 'border-indigo-900 bg-indigo-950/20' },
    { id: 'negotiation', title: 'Переговоры & Договор', color: 'border-amber-900 bg-amber-950/20' },
    { id: 'won', title: 'Успешно закрыто', color: 'border-emerald-900 bg-emerald-950/20' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Воронка продаж (Sales Funnel Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: Deal Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Конверсия и распределение сделок по стадиям согласования
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mt-4 flex-1">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount.amount, 0);

          return (
            <div
              key={stage.id}
              className={`rounded-xl border p-3 flex flex-col ${stage.color} text-xs`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="font-semibold text-slate-200">{stage.title}</span>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-cyan-300">
                  {stageDeals.length}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mb-3">
                Всего: {totalAmount.toLocaleString('ru-RU')} ₽
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 shadow-sm space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <span className="font-semibold text-slate-200 block truncate">
                      {deal.clientName}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">{deal.title}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                      <span className="font-mono text-cyan-300 font-medium">
                        {deal.amount.format()}
                      </span>
                      <span className="text-slate-500">{deal.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
