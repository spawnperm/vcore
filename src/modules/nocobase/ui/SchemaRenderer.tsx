import React, { useState, useEffect } from 'react';
import { CustomScreenSchema } from '../ui-schema/types';
import { Collection, CollectionRecord } from '../database/types';
import { collectionRepository } from '../database/CollectionRepository';
import { screenRepository } from '../ui-schema/screenRepository';
import { DynamicMetricsBlock } from './DynamicMetricsBlock';
import { DynamicTableBlock } from './DynamicTableBlock';
import { DynamicFormModal } from './DynamicFormModal';
import { CollectionEditorModal } from './CollectionEditorModal';
import { ScreenEditorModal } from './ScreenEditorModal';
import { nats } from '../../../services/nats/natsService';
import {
  Wrench,
  Eye,
  Sliders,
  Database,
  Radio,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SchemaRendererProps {
  screenId: string;
  onNavigateScreen?: (screenId: string) => void;
}

export const SchemaRenderer: React.FC<SchemaRendererProps> = ({ screenId, onNavigateScreen }) => {
  const [screen, setScreen] = useState<CustomScreenSchema | undefined>(
    screenRepository.getScreen(screenId)
  );
  const [collection, setCollection] = useState<Collection | undefined>(undefined);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [designerMode, setDesignerMode] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<CollectionRecord | undefined>(
    undefined
  );
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);

  // Live NATS Activity
  const [lastNatsMsg, setLastNatsMsg] = useState<{ subject: string; time: string; action: string } | null>(
    null
  );

  // Reload data
  const refreshData = () => {
    const currentScreen = screenRepository.getScreen(screenId);
    setScreen(currentScreen);

    if (currentScreen) {
      const col = collectionRepository.getCollection(currentScreen.collectionName);
      setCollection(col);

      if (col) {
        const { records: recs } = collectionRepository.getRecords(col.name);
        setRecords(recs);
      }
    }
  };

  useEffect(() => {
    refreshData();

    // Listen to repository updates
    const unsubCol = collectionRepository.subscribe(refreshData);
    const unsubScr = screenRepository.subscribe(refreshData);

    // Listen to NATS message stream
    const subNats = nats.subscribe('>', (msg) => {
      if (
        msg.subject.startsWith('records.v1.') ||
        msg.subject.startsWith('schema.v1.')
      ) {
        setLastNatsMsg({
          subject: msg.subject,
          time: new Date().toLocaleTimeString('ru-RU'),
          action: msg.subject.split('.').pop()?.toUpperCase() || 'EVENT',
        });
      }
    });

    return () => {
      unsubCol();
      unsubScr();
      nats.unsubscribe(subNats.sid);
    };
  }, [screenId]);

  if (!screen || !collection) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Экран или схема справочника «{screenId}» не найдены.</p>
      </div>
    );
  }

  const handleSaveRecord = (data: Record<string, any>) => {
    if (selectedRecordForEdit) {
      collectionRepository.updateRecord(collection.name, selectedRecordForEdit.id, data);
    } else {
      collectionRepository.createRecord(collection.name, data);
    }
    refreshData();
  };

  const handleDeleteRecord = (id: string) => {
    collectionRepository.deleteRecord(collection.name, id);
    refreshData();
  };

  const handleSaveCollection = (updatedCol: Omit<Collection, 'createdAt' | 'updatedAt'>) => {
    collectionRepository.updateCollection(collection.name, updatedCol);
    refreshData();
  };

  const handleSaveScreen = (updatedScreen: Omit<CustomScreenSchema, 'createdAt' | 'updatedAt'>) => {
    screenRepository.updateScreen(screen.id, updatedScreen);
    refreshData();
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 text-slate-200">
      {/* Top Banner: Designer Mode Toggle & Screen Meta */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{screen.title}</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                UI Schema Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Справочник: <span className="text-cyan-400 font-semibold">{collection.title}</span> (
              <code className="text-slate-400">{collection.name}</code>) • {collection.fields.length} полей
            </p>
          </div>
        </div>

        {/* Action Controls: Runtime vs Designer */}
        <div className="flex items-center gap-2">
          {designerMode && (
            <>
              <button
                onClick={() => setIsColModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Редактировать поля и типы данных коллекции"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Поля справочника ({collection.fields.length})</span>
              </button>

              <button
                onClick={() => setIsScreenModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Настроить видимые блоки и колонки"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Настроить экран</span>
              </button>
            </>
          )}

          <button
            onClick={() => setDesignerMode(!designerMode)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              designerMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {designerMode ? <Wrench className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{designerMode ? 'Режим конструктора: ВКЛ' : 'Конструктор экрана'}</span>
          </button>
        </div>
      </div>

      {/* Live NATS JetStream Sync Status Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400/40 animate-ping" />
          </div>
          <span className="text-[11px] text-slate-400">
            Шина событий NATS JetStream: <b className="text-slate-200">Синхронизировано</b>
          </span>
        </div>

        {lastNatsMsg ? (
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="text-slate-500">Последнее событие:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
              {lastNatsMsg.subject}
            </span>
            <span className="text-emerald-400 font-semibold">{lastNatsMsg.time}</span>
          </div>
        ) : (
          <span className="font-mono text-[10px] text-slate-500">
            Subject: records.v1.{collection.name}.* (P99 &lt; 1.6 ms)
          </span>
        )}
      </div>

      {/* Render Blocks Defined in UI Schema */}
      <div className="space-y-4">
        {screen.blocks.map((block) => {
          if (block.type === 'metrics') {
            return (
              <DynamicMetricsBlock
                key={block.id}
                block={block}
                records={records}
              />
            );
          }

          if (block.type === 'table') {
            return (
              <DynamicTableBlock
                key={block.id}
                block={block}
                collection={collection}
                records={records}
                onAddRecord={() => {
                  setSelectedRecordForEdit(undefined);
                  setIsFormModalOpen(true);
                }}
                onEditRecord={(rec) => {
                  setSelectedRecordForEdit(rec);
                  setIsFormModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Record Creation/Editing Modal */}
      <DynamicFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        collection={collection}
        record={selectedRecordForEdit}
        onSave={handleSaveRecord}
      />

      {/* Collection Schema Editor Modal */}
      <CollectionEditorModal
        isOpen={isColModalOpen}
        onClose={() => setIsColModalOpen(false)}
        collection={collection}
        onSave={handleSaveCollection}
      />

      {/* Screen Layout Editor Modal */}
      <ScreenEditorModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        collections={collectionRepository.getCollections()}
        screen={screen}
        onSave={handleSaveScreen}
      />
    </div>
  );
};
