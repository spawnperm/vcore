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
  ChevronLeft,
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
  User,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { MindmapNode, MindmapLink, AgentChatMessage, DshPortalAction } from '../types';
import { LiveVoiceControl } from './LiveVoiceControl';
import { DshResultCard } from './DshResultCard';
import { InteractiveDependencyTree } from './InteractiveDependencyTree';

interface RightSidebarProps {
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  nodes: MindmapNode[];
  links?: MindmapLink[];
  onReorganizePlan?: (newNodes: MindmapNode[], newLinks: MindmapLink[], changeDescription?: string) => void;
  onResetPlan?: () => void;
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
  currentOrg?: string;
  onOrgChange?: (org: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNodeId,
  onSelectNode,
  nodes,
  links = [],
  onReorganizePlan,
  onResetPlan,
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
  currentOrg = 'ООО Ромашка',
  onOrgChange,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'tree' | 'assistant' | 'dsh'>('all');
  const [inputCommand, setInputCommand] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleSend = () => {
    if (!inputCommand.trim()) return;
    onSendMessage(inputCommand.trim(), false);
    setInputCommand('');
  };

  return (
    <div className="relative flex shrink-0 h-full">
      {/* Collapse/Expand Toggle Button: stays at the exact same distance from the menu whether expanded or collapsed */}
      <button
        id="toggle-right-sidebar-btn"
        type="button"
        onClick={onToggleCollapse}
        className={`absolute top-3.5 -left-7 z-40 w-7 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-r-0 border-slate-700 rounded-l-lg shadow-xl flex items-center justify-center transition-all cursor-pointer group ${
          isCollapsed ? 'ring-1 ring-cyan-500/50 text-cyan-400' : ''
        }`}
        title={isCollapsed ? 'Развернуть боковое меню' : 'Свернуть боковое меню'}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-cyan-400" />
        ) : (
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

      <aside
        id="right-sidebar"
        className={`bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-14' : 'w-80 lg:w-[410px]'
        }`}
      >
        {/* User Profile Header (Top of the right sidebar, full-height alignment) */}
        <div className={`h-14 border-b border-slate-800 bg-slate-900/95 flex items-center shrink-0 relative transition-all ${
          isCollapsed ? 'justify-center px-1' : 'justify-between px-3 gap-2'
        }`}>
          <button
            id="sidebar-user-profile-button"
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`min-w-0 flex items-center rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all text-left group cursor-pointer ${
              isCollapsed ? 'p-1.5 justify-center' : 'flex-1 gap-2.5 p-1'
            }`}
            title="Иван Петров (Архитектор / Lead) — Нажмите для профиля"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                ИП
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                    Иван Петров
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      userMenuOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate leading-tight">
                  <span className="truncate">Архитектор / Lead</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-mono text-[9px]">online</span>
                </div>
              </div>
            )}
          </button>

          {/* User Profile Dropdown */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className={`absolute top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs ${
                isCollapsed ? 'right-0 w-64' : 'left-2 right-2'
              }`}>
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100">Иван Петров</p>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ivan.petrov@romashka.corp
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Полные права оркестрации
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Профиль инженера</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Lead Dev</span>
                  </button>

                  <a
                    href="https://github.com/spawnperm/vcore"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Репозиторий Git (spawnperm/vcore)</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">main</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setActiveTab('assistant');
                      if (isCollapsed) onToggleCollapse?.();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Шлюз deepseek-harness</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">live-3.8</span>
                  </button>
                </div>

                <div className="pt-1 mt-1 border-t border-slate-800/80 px-3 py-1 text-[10px] text-slate-500">
                  Организация: <span className="text-slate-300 font-medium">{currentOrg || 'ООО Ромашка'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top Sidebar Navigation Tabs (Expanded mode: 3 grid buttons; Collapsed rail mode: vertical icons) */}
        <div className="p-2 border-b border-slate-800 bg-slate-900/90 shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('all');
                  onToggleCollapse?.();
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Пульт DSH"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab('assistant');
                  onToggleCollapse?.();
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'assistant'
                    ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Чат & Live"
              >
                <Bot className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab('tree');
                  onToggleCollapse?.();
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'tree'
                    ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Дерево архитектуры"
              >
                <FolderTree className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-xs font-medium border border-slate-800">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tree'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Дерево</span>
              </button>
            </div>
          )}
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto divide-y divide-slate-800">
        {/* SECTION 1: Interactive Dependency Tree (Full height in 'tree' tab) */}
        {activeTab === 'tree' && (
          <div className="flex-1 flex flex-col min-h-0">
            <InteractiveDependencyTree
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onReorganizePlan={onReorganizePlan || (() => {})}
              onResetToDefault={onResetPlan}
            />
          </div>
        )}

        {/* SECTION 1 (Compact version in 'all' tab) */}
        {activeTab === 'all' && (
          <div className="h-[270px] flex flex-col min-h-0 shrink-0">
            <InteractiveDependencyTree
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onReorganizePlan={onReorganizePlan || (() => {})}
              onResetToDefault={onResetPlan}
            />
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
                onClick={() => onSendMessage('Сгенерируй компенсирующую транзакцию для NATS JetStream', false)}
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
  </div>
  );
};
