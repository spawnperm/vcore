import React, { useState } from 'react';
import {
  FolderTree,
  Bot,
  Info,
  Search,
  Mic,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Cpu,
  Layers,
  Shield,
  Rocket,
  Server,
  Terminal,
  Volume2,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { MindmapNode, AgentChatMessage, DshPortalAction } from '../types';
import { LiveVoiceControl } from './LiveVoiceControl';
import { DshResultCard } from './DshResultCard';

interface RightSidebarProps {
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  nodes: MindmapNode[];
  chatMessages: AgentChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => void;
  onApplyDshAction?: (action: DshPortalAction) => void;
  activeAgentName: string;
  activeAgentRole: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isDshProcessing?: boolean;
  isVoiceListening?: boolean;
  onToggleVoice?: () => void;
  voiceTranscript?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNodeId,
  onSelectNode,
  nodes,
  chatMessages,
  onSendMessage,
  onApplyDshAction,
  activeAgentName,
  activeAgentRole,
  isCollapsed = false,
  onToggleCollapse,
  isDshProcessing = false,
  isVoiceListening = false,
  onToggleVoice,
  voiceTranscript = '',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'tree' | 'assistant' | 'dsh'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [inputCommand, setInputCommand] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleSend = () => {
    if (!inputCommand.trim()) return;
    onSendMessage(inputCommand.trim(), false);
    setInputCommand('');
  };

  // Categories for tree view
  const categories = [
    {
      id: 'stack',
      name: 'Стек сервисов',
      icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
      items: nodes.filter((n) => n.category === 'stack'),
    },
    {
      id: 'infra',
      name: 'Инфраструктура',
      icon: <Server className="w-3.5 h-3.5 text-amber-400" />,
      items: nodes.filter((n) => n.category === 'infra'),
    },
    {
      id: 'ui',
      name: 'Интерфейс (UI)',
      icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
      items: nodes.filter((n) => n.category === 'ui'),
    },
    {
      id: 'security',
      name: 'Безопасность & CI/CD',
      icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
      items: nodes.filter((n) => n.category === 'security'),
    },
  ];

  return (
    <aside
      id="right-sidebar"
      className="w-80 lg:w-[410px] bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 overflow-hidden"
    >
      {/* Top Sidebar Navigation Tabs */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/90 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-xs font-medium border border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Пульт DSH</span>
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'assistant'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Чат & Live</span>
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'tree'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Дерево</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto divide-y divide-slate-800">
        {/* SECTION 1: Tree View */}
        {(activeTab === 'tree' || activeTab === 'all') && (
          <div className={`${activeTab === 'all' ? 'max-h-[220px]' : 'flex-1'} flex flex-col p-3`}>
            {/* Filter */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Фильтр узлов конфигурации..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Tree Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
              {categories.map((cat) => {
                const filteredItems = cat.items.filter((item) =>
                  item.label.toLowerCase().includes(filterQuery.toLowerCase())
                );
                if (filteredItems.length === 0 && filterQuery) return null;
                const isCollapsed = collapsedCategories[cat.id];

                return (
                  <div key={cat.id} className="rounded-lg border border-slate-800/80 bg-slate-950/40 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/50 transition-colors font-semibold"
                    >
                      <div className="flex items-center gap-1.5">
                        {cat.icon}
                        <span>{cat.name}</span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="px-1.5 py-1 space-y-0.5 border-t border-slate-800/50">
                        {filteredItems.map((item) => {
                          const isSelected = item.id === selectedNodeId;
                          return (
                            <button
                              key={item.id}
                              onClick={() => onSelectNode(item.id)}
                              className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-cyan-950/90 text-cyan-300 font-semibold border border-cyan-800/80 shadow-sm'
                                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400" />
                                <span className="truncate">{item.label}</span>
                                {item.isNew && (
                                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                    NEW
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <span className="text-cyan-400 font-mono text-[11px] shrink-0">
                                  ←
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: AI Agent Assistant Chat + Gemini Live API + DSH Gateway */}
        {(activeTab === 'assistant' || activeTab === 'all') && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/70 p-3">
            {/* Header: DSH Gateway & Current Active Agent */}
            <div className="pb-2 mb-2 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-sm">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Шлюз deepseek-harness</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    LLM: <span className="text-amber-300 font-mono font-medium">gemini-3.8-flash</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                  Live 3.8
                </span>
              </div>
            </div>

            {/* Embedded Gemini Live API Voice Controller */}
            <div className="mb-2">
              <LiveVoiceControl
                onSendCommand={(cmd, isVoice) => onSendMessage(cmd, isVoice)}
                isProcessing={isDshProcessing}
              />
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      {msg.isVoice && <Mic className="w-2.5 h-2.5 text-rose-400" />}
                      {msg.sender === 'user' ? 'Вы (Голос / Текст)' : msg.agentName || 'DSH Агент'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl max-w-[95%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* If this message contains DSH Execution results */}
                  {msg.dshResult && (
                    <DshResultCard
                      result={msg.dshResult}
                      onApplyAction={onApplyDshAction}
                    />
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 max-w-[95%]">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => onSendMessage(action, false)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-cyan-950 hover:border-cyan-700 hover:text-cyan-300 text-slate-300 border border-slate-700 transition-colors"
                        >
                          ⚡ {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isDshProcessing && (
                <div className="flex flex-col items-start">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-800/60 text-slate-300 text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>deepseek-harness: Gemini 3.8 Flash компилирует патч...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="pt-2 flex flex-wrap gap-1">
              <button
                onClick={() => onSendMessage('выбери Saga', false)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600 transition-colors"
              >
                Выбери Saga
              </button>
              <button
                onClick={() => onSendMessage('Сгенерируй компенсирующую транзакцию для Kafka', false)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600 transition-colors"
              >
                + Компенсация
              </button>
              <button
                onClick={() => onSendMessage('Включи Circuit Breaker для банковского шлюза', false)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600 transition-colors"
              >
                Circuit Breaker
              </button>
            </div>

            {/* Live voice speech status if listening */}
            {isVoiceListening && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-[11px] flex items-center justify-between gap-2 text-rose-300 animate-pulse">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="truncate font-mono">
                    {voiceTranscript ? `«${voiceTranscript}»` : 'Слушаю ваш голос (Web Speech API)...'}
                  </span>
                </div>
                {onToggleVoice && (
                  <button
                    onClick={onToggleVoice}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 shrink-0"
                  >
                    Отправить
                  </button>
                )}
              </div>
            )}

            {/* Input & Manual Send */}
            <div className="mt-2 pt-2 border-t border-slate-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    isVoiceListening
                      ? 'Идёт запись голоса...'
                      : 'Команда для DSH (или нажмите микрофон)...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-16 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />

                <div className="absolute right-1.5 flex items-center gap-1">
                  {onToggleVoice && (
                    <button
                      id="sidebar-web-speech-mic-btn"
                      type="button"
                      onClick={onToggleVoice}
                      className={`p-1.5 rounded-md transition-colors ${
                        isVoiceListening
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800'
                      }`}
                      title={
                        isVoiceListening
                          ? 'Остановить запись и отправить команду в DSH'
                          : 'Запустить голосовой ввод через Web Speech API'
                      }
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={!inputCommand.trim() || isDshProcessing}
                    className="p-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:hover:bg-cyan-600 transition-colors"
                    title="Отправить в DSH"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Selected Node Context Card */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Контекст программирования
          </span>
          <span className="font-mono text-cyan-400">{selectedNode.progress}%</span>
        </div>
        <p className="font-bold text-slate-200 truncate">{selectedNode.label}</p>
        <p className="text-slate-400 line-clamp-1 mt-0.5">{selectedNode.description}</p>
      </div>
    </aside>
  );
};
