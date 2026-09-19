import React from 'react';
import { ViewMode } from '../../shell/PortalTopBar';
import { RefundSaga } from '../../../domain/billing/model';
import { AlertCircle, Clock, CheckCircle2, RefreshCw, Server, Activity, ShieldCheck } from 'lucide-react';

interface BillingModuleViewProps {
  viewMode: ViewMode;
  sagas: RefundSaga[];
  activeSaga: RefundSaga;
  onSelectSaga: (id: string) => void;
  onOpenNewSagaModal: () => void;
}

export const BillingModuleView: React.FC<BillingModuleViewProps> = ({
  viewMode,
  sagas,
  activeSaga,
  onSelectSaga,
  onOpenNewSagaModal,
}) => {
  if (viewMode === 'current') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-500" />
        </div>
        <h4 className="text-slate-200 font-bold text-base">
          Раздел «Billing» не развёрнут (HTTP 404)
        </h4>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          В текущей продакшн-версии (v2.3) распределённый модуль возвратов отсутствует.
          Переключитесь на «🟡 После изменений (Stage v2.4)» или «⚪ Diff (Наложение)» для тестирования функционала.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col ${
        viewMode === 'diff' ? 'ring-2 ring-emerald-500 bg-emerald-950/10 p-2 rounded-xl' : ''
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">
              Оркестратор возвратов (Billing & Saga Context)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
              DDD SAGA PATTERN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Распределённая транзакция: Order Service → Bank Acquirer → Ledger → Kafka → Notify
          </p>
        </div>

        <button
          onClick={onOpenNewSagaModal}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-colors"
        >
          + Новая транзакция
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Активные транзакции</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-cyan-300 mt-1 font-mono">{sagas.length} саги</p>
          <span className="text-[10px] text-emerald-400 mt-1 block">● Оркестратор в норме</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Сумма проведённых возвратов</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">46 700 ₽</p>
          <span className="text-[10px] text-slate-400 mt-1 block">За последние 24 часа</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Ср. время выполнения саги</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-indigo-300 mt-1 font-mono">1.8 сек</p>
          <span className="text-[10px] text-indigo-400 mt-1 block">p99 &lt; 3.2 сек</span>
        </div>
      </div>

      {/* Active Saga Execution Flow Card */}
      {activeSaga && (
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 text-xs mb-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 font-bold text-sm">
                  {activeSaga.id}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200 font-semibold">{activeSaga.orderNumber}</span>
                <span className="text-slate-400 font-mono">({activeSaga.amount.format()})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Инициатор: {activeSaga.initiator} · Причина: «{activeSaga.reason}»
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium flex items-center gap-1.5 ${
                activeSaga.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
              }`}
            >
              {activeSaga.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Успешно завершена
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Выполняется оркестрация
                </>
              )}
            </span>
          </div>

          {/* Saga Steps Timeline */}
          <div className="mt-4 space-y-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Шаги транзакции (Compensating Saga Pipeline)
            </span>
            <div className="space-y-2">
              {activeSaga.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    step.status === 'COMPLETED'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                      : step.status === 'RUNNING'
                      ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/40 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : step.status === 'RUNNING'
                          ? 'bg-cyan-600 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-xs block">{step.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Сервис: {step.service}
                        {step.message ? ` — ${step.message}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    {step.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {step.latencyMs} ms
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        step.status === 'COMPLETED'
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : step.status === 'RUNNING'
                          ? 'text-cyan-300 bg-cyan-950'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sagas List */}
      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-xs">
        <h4 className="font-semibold text-slate-300 mb-2">История сессий Saga</h4>
        <div className="space-y-1.5">
          {sagas.map((saga) => (
            <button
              key={saga.id}
              onClick={() => onSelectSaga(saga.id)}
              className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                saga.id === activeSaga?.id
                  ? 'bg-slate-850 border-cyan-700 text-cyan-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <span className="font-mono font-bold text-xs">{saga.id}</span>
                <span className="text-[11px] text-slate-400 ml-2">
                  {saga.orderNumber} · {saga.amount.format()}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  saga.status === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-amber-950 text-amber-300'
                }`}
              >
                {saga.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
