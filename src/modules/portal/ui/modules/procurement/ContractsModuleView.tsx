import React from 'react';
import { ContractEntity } from '../../../domain/procurement/model';
import { FileText, CheckCircle2, Clock } from 'lucide-react';

interface ContractsModuleViewProps {
  contracts: ContractEntity[];
}

export const ContractsModuleView: React.FC<ContractsModuleViewProps> = ({ contracts }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Реестр контрактов и соглашений (Contracts Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: Contract
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Юридически обязывающие договоры и статусы ЭДО
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Номер договора</th>
              <th className="p-3">Контрагент</th>
              <th className="p-3">Предмет договора</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Срок действия</th>
              <th className="p-3">ЭДО</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {contracts.map((cnt) => (
              <tr key={cnt.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono font-semibold text-cyan-300">
                  {cnt.number}
                </td>
                <td className="p-3 font-medium">{cnt.supplierName}</td>
                <td className="p-3 text-slate-300">{cnt.subject}</td>
                <td className="p-3 font-mono font-medium">{cnt.totalValue.format()}</td>
                <td className="p-3 text-[11px] text-slate-400 font-mono">
                  до {cnt.validUntil}
                </td>
                <td className="p-3">
                  {cnt.edoSigned ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Подписан
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      На согласовании
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
