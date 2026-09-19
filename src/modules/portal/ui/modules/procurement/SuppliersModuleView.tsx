import React from 'react';
import { SupplierEntity } from '../../../domain/procurement/model';
import { Truck, Star, ShieldCheck } from 'lucide-react';

interface SuppliersModuleViewProps {
  suppliers: SupplierEntity[];
}

export const SuppliersModuleView: React.FC<SuppliersModuleViewProps> = ({ suppliers }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Поставщики оборудования (Procurement Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: Supplier
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Аккредитованные производители и условия оплат
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between text-xs space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">{sup.name}</span>
                <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {sup.rating}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{sup.category}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Страна:</span>
                <span>{sup.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Условия:</span>
                <span>{sup.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Надёжность:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {sup.reliabilityScore}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
