import React from 'react';
import { ClientEntity } from '../../../domain/sales/model';
import { Users, Building, ShieldCheck, Mail } from 'lucide-react';

interface ClientsModuleViewProps {
  clients: ClientEntity[];
}

export const ClientsModuleView: React.FC<ClientsModuleViewProps> = ({ clients }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Контрагенты и клиенты (CRM Context)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Aggregate: Customer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Юридические лица, обороты и контактные данные
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Компания / ИНН</th>
              <th className="p-3">Сегмент</th>
              <th className="p-3">Заказов</th>
              <th className="p-3">Оборот</th>
              <th className="p-3">Контактное лицо</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3">
                  <span className="font-semibold text-slate-100 block">{client.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">ИНН: {client.inn}</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      client.tier === 'Enterprise'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : client.tier === 'VIP'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {client.tier}
                  </span>
                </td>
                <td className="p-3 font-mono">{client.ordersCount}</td>
                <td className="p-3 font-mono font-medium text-cyan-300">
                  {client.totalTurnover.format()}
                </td>
                <td className="p-3">
                  <span className="text-slate-200 block">{client.contactPerson}</span>
                  <span className="text-[11px] text-slate-500">{client.email}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    Активен
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
