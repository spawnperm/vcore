import React from 'react';
import { InventoryItemEntity } from '../../../domain/procurement/model';
import { Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryModuleViewProps {
  inventory: InventoryItemEntity[];
}

export const InventoryModuleView: React.FC<InventoryModuleViewProps> = ({ inventory }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Складской учёт и остатки (Inventory Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: StockItem
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Партионный учёт номенклатуры, доступные резервы и критические пороги
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Артикул (SKU)</th>
              <th className="p-3">Наименование номенклатуры</th>
              <th className="p-3">Локация склада</th>
              <th className="p-3">В наличии</th>
              <th className="p-3">В резерве</th>
              <th className="p-3">Мин. порог</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono font-semibold text-cyan-300">
                  {item.sku}
                </td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-slate-400 text-[11px]">{item.warehouse}</td>
                <td className="p-3 font-mono font-semibold text-emerald-400">
                  {item.availableStock} {item.unit}
                </td>
                <td className="p-3 font-mono text-amber-400">
                  {item.reservedStock} {item.unit}
                </td>
                <td className="p-3 font-mono text-slate-500">
                  {item.minThreshold} {item.unit}
                </td>
                <td className="p-3">
                  {item.status === 'low_stock' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Мало на складе
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      В норме
                    </span>
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
