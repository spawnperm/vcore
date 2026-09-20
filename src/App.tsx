import React, { useState, useEffect } from 'react';
import {
  TabType,
  MindmapNode,
  MindmapLink,
  DocItem,
  PortalScreen,
  DataFlowNode,
  DataFlowStream,
  HistoryEvent,
  AgentChatMessage,
  DshPortalAction,
  DshExecutionResult,
} from './types';
import {
  INITIAL_MINDMAP_NODES,
  INITIAL_MINDMAP_LINKS,
  MOCK_DOCS,
  MOCK_SCREENS,
  MOCK_DATAFLOW_NODES,
  MOCK_DATAFLOW_STREAMS,
  MOCK_HISTORY,
  INITIAL_CHAT_MESSAGES,
} from './mockData';
import { executeDshCommand, streamAudioOrTextToGeminiFlash } from './services/dshService';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useLocalStorageSync } from './hooks/useLocalStorageSync';

import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { RightSidebar } from './components/RightSidebar';
import { PlanTab } from './components/tabs/PlanTab';
import { DocsTab } from './components/tabs/DocsTab';
import { PortalViewTab } from './components/tabs/PortalViewTab';
import { DataFlowsTab } from './components/tabs/DataFlowsTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { CommitModal } from './components/CommitModal';
import { SearchModal } from './components/SearchModal';
import { PrModal } from './components/PrModal';
import {
  Brain,
  FileText,
  Monitor,
  Activity,
  History,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [selectedOrg, setSelectedOrg] = useState('ООО Ромашка');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Synchronized Entities State across all 5 views
  const [selectedNodeId, setSelectedNodeId] = useState<string>('billing-node');
  const [selectedDocId, setSelectedDocId] = useState<string>('adr-042');
  const [selectedScreenId, setSelectedScreenId] = useState<string>('screen-orders');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('stream-billing-kafka');

  // Execution & Simulation Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(3);
  const totalSteps = 5;
  const [currentBranch] = useState('feature/refund-endpoint');
  const [progressPercent, setProgressPercent] = useState(60);
  const [activeAgentAction, setActiveAgentAction] = useState('Billing-агент: генерация saga-компенсатора');

  // Persistent data state synced with localStorage (nodes, links, docs, history)
  const {
    nodes,
    setNodes,
    links,
    setLinks,
    docs,
    setDocs,
    historyEvents,
    setHistoryEvents,
    lastSaved: lastStorageSaved,
    isSaving: isSavingStorage,
    resetToDefaults: resetStorageToDefaults,
  } = useLocalStorageSync({
    initialNodes: INITIAL_MINDMAP_NODES,
    initialLinks: INITIAL_MINDMAP_LINKS,
    initialDocs: MOCK_DOCS,
    initialHistory: MOCK_HISTORY,
  });
  const [screens] = useState<PortalScreen[]>(MOCK_SCREENS);
  const [dataFlowNodes] = useState<DataFlowNode[]>(MOCK_DATAFLOW_NODES);
  const [dataFlowStreams] = useState<DataFlowStream[]>(MOCK_DATAFLOW_STREAMS);
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [isDshProcessing, setIsDshProcessing] = useState<boolean>(false);

  // Modals state
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);

  // Keyboard shortcut for ⌘K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize context when selectedNodeId changes across views
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);

    // Context synchronization mappings
    if (nodeId === 'billing-node' || nodeId === 'saga-pattern') {
      setSelectedDocId('adr-042');
      setSelectedScreenId('screen-orders');
      setSelectedStreamId('stream-billing-kafka');
    } else if (nodeId === 'refund-endpoint' || nodeId === 'api-gateway') {
      setSelectedDocId('api-refund');
      setSelectedStreamId('stream-web-gw');
    } else if (nodeId === 'portal-orders') {
      setSelectedScreenId('screen-orders');
    } else if (nodeId === 'postgres-db') {
      setSelectedStreamId('stream-billing-db');
      setSelectedDocId('adr-042');
    }
  };

  // Node progress update handler
  const handleUpdateNodeProgress = (nodeId: string, progress: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, progress } : n))
    );
  };

  // Handler for reorganizing the plan via drag-and-drop in the dependency tree
  const handleReorganizePlan = (
    newNodes: MindmapNode[],
    newLinks: MindmapLink[],
    changeDescription?: string
  ) => {
    setNodes(newNodes);
    setLinks(newLinks);

    if (changeDescription) {
      setActiveAgentAction(changeDescription);
      // Append decision event to history
      setHistoryEvents((prev) => [
        {
          id: `event-${Date.now()}`,
          time: 'Только что',
          type: 'decision',
          title: 'Реорганизация логики плана выполнения',
          author: 'Иван Петров (Архитектор)',
          agents: ['Tech Lead', 'deepseek-harness'],
          details: changeDescription,
          status: 'approved',
        },
        ...prev,
      ]);

      // Add system message to agent chat
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'system',
          text: `⚡ План синхронизирован: ${changeDescription}. Граф зависимостей и очередность шагов обновлены.`,
          timestamp: 'Только что',
        },
      ]);
    }
  };

  const handleResetPlan = () => {
    setNodes(INITIAL_MINDMAP_NODES);
    setLinks(INITIAL_MINDMAP_LINKS);
    setActiveAgentAction('Структура плана сброшена к исходной');
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        text: '🔄 Структура плана и граф зависимостей сброшены к исходному состоянию.',
        timestamp: 'Только что',
      },
    ]);
  };

  // Interactive Execution Loop Simulation (Play button advances plan)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps) {
            setIsPlaying(false);
            setActiveAgentAction('Все шаги плана «refund» успешно выполнены и зафиксированы');
            setProgressPercent(100);
            return totalSteps;
          }
          const next = prev + 1;
          if (next === 4) {
            setActiveAgentAction('Docs-агент: синхронизация OpenAPI и публикация ADR-042');
            setProgressPercent(80);
            setNodes((nList) =>
              nList.map((n) =>
                n.id === 'refund-endpoint'
                  ? { ...n, status: 'completed', progress: 100 }
                  : n
              )
            );
            // Append agent message
            setChatMessages((msgs) => [
              ...msgs,
              {
                id: `msg-${Date.now()}`,
                sender: 'agent',
                agentName: 'Docs-агент',
                avatar: '🤖',
                text: 'Шаг 4 завершён: Спецификация POST /refund скомпилирована, валидация схем пройдена.',
                timestamp: 'Только что',
                suggestedActions: ['Открыть ADR-042', 'Просмотреть OpenAPI'],
              },
            ]);
          } else if (next === 5) {
            setActiveAgentAction('UI/UX-агент: подключение кнопки возврата к живому экрану Заказов');
            setProgressPercent(100);
            setNodes((nList) =>
              nList.map((n) =>
                n.id === 'portal-orders'
                  ? { ...n, status: 'completed', progress: 100 }
                  : n
              )
            );
            setChatMessages((msgs) => [
              ...msgs,
              {
                id: `msg-${Date.now()}`,
                sender: 'agent',
                agentName: 'UI-агент',
                avatar: '🎨',
                text: 'Шаг 5 завершён: Компонент формы возврата смонтирован на странице реестра заказов. Готово к коммиту!',
                timestamp: 'Только что',
                suggestedActions: ['Оформить коммит', 'Открыть PR #4822'],
              },
            ]);
          }
          return next;
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleStepForward = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setProgressPercent(Math.min(100, progressPercent + 20));
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgressPercent(Math.max(20, progressPercent - 20));
    }
  };

  // Assistant Send Message Handler with DeepSeek-Harness & Gemini Live API integration
  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    const userMsg: AgentChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      isVoice,
      timestamp: 'Только что',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsDshProcessing(true);
    setActiveAgentAction(
      isVoice
        ? 'Gemini Live API: передача голосовой команды в шлюз deepseek-harness...'
        : 'deepseek-harness: Gemini 3.8 Flash анализирует команду и компилирует патч...'
    );

    try {
      const context = {
        selectedNodeId,
        selectedDocId,
        selectedScreenId,
        selectedStreamId,
        activeTab,
      };
      const portalState = {
        branch: currentBranch,
        currentStep,
        progressPercent,
      };

      const agentReplyId = `a-${Date.now()}`;
      let streamingContent = '';

      // Create initial agent message slot
      const initialAgentReply: AgentChatMessage = {
        id: agentReplyId,
        sender: 'agent',
        agentName: 'deepseek-harness (gemini-3.8-flash)',
        avatar: '⚡',
        text: '...',
        timestamp: 'Только что',
        isVoice,
      };
      setChatMessages((prev) => [...prev, initialAgentReply]);

      const streamRes = await streamAudioOrTextToGeminiFlash({
        text,
        context,
        portalState,
        onStatus: (status) => {
          setActiveAgentAction(status);
        },
        onChunk: (_chunk, accumulated) => {
          streamingContent = accumulated;
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentReplyId ? { ...msg, text: accumulated } : msg
            )
          );
        },
        onResult: (result) => {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentReplyId
                ? {
                    ...msg,
                    text: result.explanation || streamingContent || msg.text,
                    suggestedActions: result.suggestedActions,
                    dshResult: result,
                  }
                : msg
            )
          );
        },
      });

      // Ensure final state has DSH result and text
      if (streamRes.dshResult) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentReplyId
              ? {
                  ...msg,
                  text: streamRes.dshResult?.explanation || streamRes.fullText || msg.text,
                  suggestedActions: streamRes.dshResult?.suggestedActions,
                  dshResult: streamRes.dshResult,
                }
              : msg
          )
        );
      }

      setActiveAgentAction('DSH (Gemini 3.8 Flash): патч готов к развёртыванию в портал');
    } catch (err) {
      console.error('DSH execution error:', err);
      const fallbackReply: AgentChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        agentName: 'deepseek-harness',
        avatar: '⚡',
        text: `Команда принята в шлюз DSH: «${text}». Все компоненты синхронизированы.`,
        timestamp: 'Только что',
        suggestedActions: ['Открыть экран Заказов', 'Проверить Diff'],
      };
      setChatMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsDshProcessing(false);
    }
  };

  // Web Speech API Hook: captures user voice, transcribes to text,
  // and passes it directly to handleSendMessage in App.tsx
  const {
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    fullTranscript: voiceFullTranscript,
    startListening: startVoiceInput,
    stopListening: stopVoiceInput,
    toggleListening: toggleVoiceInput,
    error: voiceError,
    isSupported: isWebSpeechSupported,
  } = useVoiceInput({
    onSendMessage: handleSendMessage,
    lang: 'ru-RU',
    autoSendOnStop: true,
  });

  // Handler for applying DSH generated actions to the live Portal
  const handleApplyDshAction = (action: DshPortalAction) => {
    setActiveAgentAction(`DSH: Применение «${action.summary}»...`);

    if (action.type === 'add_screen_feature') {
      // Advance node in Plan
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'portal-orders' || n.id === 'billing-node'
            ? { ...n, status: 'completed', progress: 100 }
            : n
        )
      );
      // Switch tab to portal so the user immediately sees the changes
      setActiveTab('portal');
    } else if (action.type === 'update_stream') {
      // Update stream latency
      setActiveTab('dataflows');
    }

    // Register Git commit in History
    const newCommitEvent: HistoryEvent = {
      id: `dsh-ev-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'commit',
      title: `[DSH / gemini-3.8-flash]: ${action.summary}`,
      author: 'deepseek-harness',
      agents: ['DSH Engine', 'Gemini 3.8 Flash', 'Live API'],
      prNumber: '#4824',
      servicesAffected: ['Portal Frontend', 'Kafka Gateway', 'Saga Orchestrator'],
      docsAffected: ['ADR-042', 'OpenAPI'],
      details: 'Патч кода автоматически сгенерирован и внедрён в структуру портала.',
      relatedNodeId: selectedNodeId,
    };
    setHistoryEvents((prev) => [newCommitEvent, ...prev]);
    setActiveAgentAction(`DSH: Изменения успешно развёрнуты в «${selectedOrg}»`);
  };

  // Commit Handler
  const handleCommitConfirm = (commitMessage: string) => {
    const newEvent: HistoryEvent = {
      id: `ev-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'commit',
      title: commitMessage,
      author: 'Иван Петров',
      agents: ['Billing', 'API', 'Docs', 'UI'],
      prNumber: '#4823',
      servicesAffected: ['Billing', 'Gateway', 'Web UI'],
      docsAffected: ['ADR-042', 'OpenAPI'],
      details: 'Коммит успешно сформирован и запушен в ветку feature/refund-endpoint.',
      relatedNodeId: 'billing-node',
    };
    setHistoryEvents((prev) => [newEvent, ...prev]);
    setActiveAgentAction('Коммит #4823 успешно зафиксирован');
  };

  // Rollback Handler
  const handleRollbackEvent = (eventId: string) => {
    const ev = historyEvents.find((e) => e.id === eventId);
    if (!ev) return;
    const rollbackEvent: HistoryEvent = {
      id: `rb-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'deploy',
      title: `Откат: ${ev.title}`,
      author: 'Иван Петров',
      agents: ['Инфра', 'Lead'],
      details: `Успешно выполнен откат состояния до точки ${ev.time}. Конфигурация синхронизирована.`,
      relatedNodeId: ev.relatedNodeId,
    };
    setHistoryEvents((prev) => [rollbackEvent, ...prev]);
    setActiveAgentAction(`Откат выполнен: ${ev.title}`);
  };

  // Approve Document Handler
  const handleApproveDoc = (docId: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'approved' } : d))
    );
    const ev: HistoryEvent = {
      id: `appr-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'decision',
      title: 'ADR-042 утверждён ведущим архитектором',
      author: 'Иван Петров',
      agents: ['Docs', 'Архитектура'],
      details: 'Статус архитектурного решения переведён в «Утверждён».',
      relatedNodeId: 'billing-node',
    };
    setHistoryEvents((prev) => [ev, ...prev]);
  };

  // Document Content Update Handler (persists to localStorage)
  const handleUpdateDoc = (docId: string, updatedContent: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, content: updatedContent, lastModified: 'Только что (сохранено)' }
          : d
      )
    );
    setActiveAgentAction('Документ обновлён и синхронизирован в localStorage');
  };

  // Reset entire local storage to initial defaults
  const handleResetAllStorage = () => {
    if (window.confirm('Сбросить все сохранённые данные (узлы, доки, историю) к исходному состоянию?')) {
      resetStorageToDefaults();
      setActiveAgentAction('Локальное хранилище очищено, состояние сброшено к исходному');
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'system',
          text: '🔄 Локальное хранилище очищено: граф узлов, документы и история событий возвращены к исходному состоянию.',
          timestamp: 'Только что',
        },
      ]);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased select-none">
      {/* Left/Center Column: Header, Tab Switcher, Workspace, PlayerBar */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* 1. Top Global Header (Brand, Tenant switcher, Search, Alerts) */}
        <Header
          currentOrg={selectedOrg}
          onOrgChange={setSelectedOrg}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isVoiceListening={isVoiceListening}
          onToggleVoice={toggleVoiceInput}
          isSavingStorage={isSavingStorage}
          lastStorageSaved={lastStorageSaved}
          onResetStorage={handleResetAllStorage}
        />

        {/* 2. Main Synchronized Tab Switcher Bar matching user ASCII diagram */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
          {/* Left: 5 Modes / Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {/* Tab 1: План */}
            <button
              id="tab-btn-plan"
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'plan'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>🧠 План</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950/70 text-cyan-300 border border-cyan-800/60">
                60%
              </span>
            </button>

            {/* Tab 2: Доки */}
            <button
              id="tab-btn-docs"
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'docs'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 Доки</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                🔄 draft
              </span>
            </button>

            {/* Tab 3: Портал */}
            <button
              id="tab-btn-portal"
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'portal'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🖼️ Портал</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                🆕
              </span>
            </button>

            {/* Tab 4: Потоки */}
            <button
              id="tab-btn-dataflows"
              onClick={() => setActiveTab('dataflows')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'dataflows' || activeTab === 'flows'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>🔄 Потоки</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                🔴 1 issue
              </span>
            </button>

            {/* Tab 5: История */}
            <button
              id="tab-btn-history"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>📜 История</span>
              <span className="text-[10px] font-mono text-slate-400">
                {historyEvents.length}
              </span>
            </button>
          </nav>

          {/* Right Info: Synchronized Active Node pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Активный контекст синхронизации:</span>
            <div
              onClick={() => {
                setActiveTab('plan');
              }}
              className="cursor-pointer px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono font-medium flex items-center gap-1.5 hover:bg-cyan-900 transition-colors"
              title="Кликните для перехода в миндмап к этому узлу"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>🧩 {selectedNode.label}</span>
              <span className="text-[10px] text-cyan-400">({selectedNode.progress}%)</span>
            </div>
          </div>
        </div>

        {/* 3. Main Dynamic Content Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
          {activeTab === 'plan' && (
            <PlanTab
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onUpdateNodeProgress={handleUpdateNodeProgress}
            />
          )}

          {activeTab === 'docs' && (
            <DocsTab
              docs={docs}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onSelectNode={(nodeId) => {
                handleSelectNode(nodeId);
                setActiveTab('plan');
              }}
              onOpenPrModal={() => setIsPrModalOpen(true)}
              onDiscussWithAgent={(title) => {
                handleSendMessage(`Давай обсудим раздел документации: ${title}`);
              }}
              onApproveDoc={handleApproveDoc}
              onUpdateDoc={handleUpdateDoc}
            />
          )}

          {activeTab === 'portal' && (
            <PortalViewTab
              screens={screens}
              selectedScreenId={selectedScreenId}
              onSelectScreen={setSelectedScreenId}
              onDiscussWithAgent={(context) => {
                handleSendMessage(`UX замечание по экрану: ${context}`);
              }}
            />
          )}

          {(activeTab === 'dataflows' || activeTab === 'flows') && (
            <DataFlowsTab
              nodes={dataFlowNodes}
              streams={dataFlowStreams}
              selectedStreamId={selectedStreamId}
              onSelectStream={setSelectedStreamId}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              events={historyEvents}
              selectedNodeId={selectedNodeId}
              onSelectNodeAndTab={(nodeId, tab) => {
                handleSelectNode(nodeId);
                setActiveTab(tab);
              }}
              onOpenPrModal={() => setIsPrModalOpen(true)}
              onRollbackEvent={handleRollbackEvent}
            />
          )}
        </main>

        {/* 4. Bottom Player Bar (Unified Execution & State Control) */}
        <PlayerBar
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStop={() => {
            setIsPlaying(false);
            setCurrentStep(1);
            setProgressPercent(20);
          }}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          progress={progressPercent}
          currentAction={activeAgentAction}
          activeBranch={currentBranch}
          agentsCount={3}
          onOpenCommitModal={() => setIsCommitModalOpen(true)}
          onOpenBranchModal={() => setIsPrModalOpen(true)}
          onOpenAgentsModal={() => {
            // Switch to assistant in sidebar
            setIsSidebarCollapsed(false);
          }}
        />
      </div>

      {/* Right Sidebar: Full-Height from top of screen to bottom of screen */}
      <RightSidebar
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectNode}
        nodes={nodes}
        links={links}
        onReorganizePlan={handleReorganizePlan}
        onResetPlan={handleResetPlan}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onApplyDshAction={handleApplyDshAction}
        isDshProcessing={isDshProcessing}
        activeAgentName={selectedNode.agent || 'deepseek-harness'}
        activeAgentRole={selectedNode.agentRole || 'Генерация Saga-оркестратора'}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isVoiceListening={isVoiceListening}
        onToggleVoice={toggleVoiceInput}
        voiceTranscript={voiceFullTranscript}
        currentOrg={selectedOrg}
        onOrgChange={setSelectedOrg}
      />

      {/* Floating Web Speech Recognition Overlay Bar */}
      {isVoiceListening && (
        <div
          id="web-speech-active-overlay"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-rose-500/80 shadow-2xl shadow-rose-950/60 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-semibold text-rose-300 tracking-wide uppercase">
              Web Speech API:
            </span>
          </div>

          <div className="max-w-md truncate text-xs font-mono text-slate-100">
            {voiceFullTranscript ? (
              <span className="text-cyan-300 font-medium">«{voiceFullTranscript}»</span>
            ) : (
              <span className="text-slate-400 italic">Говорите голосовую команду в микрофон...</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <button
              onClick={() => stopVoiceInput(true)}
              className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm"
              title="Отправить распознанный текст в handleSendMessage"
            >
              Отправить
            </button>
            <button
              onClick={() => stopVoiceInput(false)}
              className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Отменить голосовой ввод"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Web Speech Error Toast */}
      {voiceError && (
        <div
          id="web-speech-error-toast"
          className="fixed top-16 right-4 z-50 bg-rose-950/90 border border-rose-700 text-rose-200 text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <span>⚠️ {voiceError}</span>
        </div>
      )}

      {/* Modals & Dialogs */}
      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommit={handleCommitConfirm}
        branch={currentBranch}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        nodes={nodes}
        docs={docs}
        screens={screens}
        onSelectResult={(type, id) => {
          if (type === 'node') {
            handleSelectNode(id);
            setActiveTab('plan');
          } else if (type === 'doc') {
            setSelectedDocId(id);
            setActiveTab('docs');
          } else if (type === 'screen') {
            setSelectedScreenId(id);
            setActiveTab('portal');
          }
        }}
      />

      <PrModal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        prNumber="#4822"
      />
    </div>
  );
}
