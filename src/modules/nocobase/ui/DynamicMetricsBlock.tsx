import React from 'react';
import { UiBlockSchema } from '../ui-schema/types';
import { CollectionRecord } from '../database/types';
import { TrendingUp, Hash, DollarSign } from 'lucide-react';

interface DynamicMetricsBlockProps {
  block: UiBlockSchema;
  records: CollectionRecord[];
}

export const DynamicMetricsBlock: React.FC<DynamicMetricsBlockProps> = ({ block, records }) => {
  if (!block.metrics || block.metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      {block.metrics.map((m) => {
        let value: string | number = 0;

        if (m.aggregationType === 'count') {
          value = records.length;
        } else if (m.aggregationType === 'sum' && m.aggregationField) {
          const sum = records.reduce((acc, r) => acc + (Number(r[m.aggregationField!]) || 0), 0);
          value = sum.toLocaleString('ru-RU');
        } else if (m.aggregationType === 'avg' && m.aggregationField) {
          const valid = records.filter((r) => !isNaN(Number(r[m.aggregationField!])));
          const sum = valid.reduce((acc, r) => acc + Number(r[m.aggregationField!]), 0);
          const avg = valid.length > 0 ? Math.round(sum / valid.length) : 0;
          value = avg.toLocaleString('ru-RU');
        }

        const colorClasses = {
          cyan: 'bg-cyan-950/50 border-cyan-800/80 text-cyan-300',
          emerald: 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300',
          amber: 'bg-amber-950/50 border-amber-800/80 text-amber-300',
          rose: 'bg-rose-950/50 border-rose-800/80 text-rose-300',
          purple: 'bg-purple-950/50 border-purple-800/80 text-purple-300',
        }[m.color || 'cyan'];

        const icon =
          m.aggregationType === 'sum' ? (
            <DollarSign className="w-4 h-4 opacity-80" />
          ) : m.aggregationType === 'avg' ? (
            <TrendingUp className="w-4 h-4 opacity-80" />
          ) : (
            <Hash className="w-4 h-4 opacity-80" />
          );

        return (
          <div
            key={m.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${colorClasses} shadow-sm backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between text-xs opacity-80 mb-1">
              <span className="font-medium truncate">{m.label}</span>
              {icon}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              {m.prefix && <span className="text-xs font-mono">{m.prefix}</span>}
              <span className="text-xl font-extrabold tracking-tight font-mono">{value}</span>
              {m.suffix && <span className="text-xs font-mono opacity-80">{m.suffix}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
