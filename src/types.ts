export type TabType = 'plan' | 'docs' | 'portal' | 'dataflows' | 'flows' | 'history';

export type NodeStatus = 'completed' | 'in_progress' | 'draft' | 'pending';

export interface MindmapNode {
  id: string;
  label: string;
  category: 'stack' | 'infra' | 'ui' | 'security' | 'docs';
  parentId?: string;
  status: NodeStatus;
  progress: number; // 0 to 100
  agent?: string;
  agentRole?: string;
  isNew?: boolean;
  x: number;
  y: number;
  description: string;
  relatedDocId?: string;
  relatedScreenId?: string;
  relatedFlowId?: string;
}

export interface MindmapLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  isPulsing?: boolean;
  isNew?: boolean;
}

export interface DocItem {
  id: string;
  title: string;
  type: 'adr' | 'api' | 'guide' | 'changelog' | 'faq';
  status: 'draft' | 'approved' | 'review' | 'deprecated';
  author: string;
  relatedNodes: string[];
  tags: string[];
  lastModified: string;
  version?: string;
  content: string;
}

export interface DocComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  selectedText?: string;
}

export interface PortalScreen {
  id: string;
  title: string;
  section: string;
  isNew?: boolean;
  currentPreviewHtml?: string;
  afterPreviewHtml?: string;
  diffSummary?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export interface DataFlowNode {
  id: string;
  name: string;
  type: 'user' | 'service' | 'db' | 'queue' | 'external';
  status: 'active' | 'warning' | 'idle';
  layer: 'services' | 'db' | 'queues' | 'external';
  x: number;
  y: number;
  isNew?: boolean;
  piiData?: boolean;
}

export interface DataFlowStream {
  id: string;
  source: string;
  target: string;
  protocol: 'HTTP' | 'gRPC' | 'Kafka' | 'SQL';
  state: 'active' | 'modified' | 'problem' | 'planned';
  isNew?: boolean;
  throughput: string;
  latency: string;
  owner: string;
  schemaSample?: string;
  piiSensitive?: boolean;
  issueDescription?: string;
}

export interface HistoryEvent {
  id: string;
  time: string;
  type: 'commit' | 'deploy' | 'incident' | 'decision' | 'node_added' | 'start';
  title: string;
  author: string;
  agents: string[];
  prNumber?: string;
  servicesAffected?: string[];
  docsAffected?: string[];
  details?: string;
  canRollback?: boolean;
  status?: 'merged' | 'resolved' | 'approved' | 'active';
  relatedNodeId?: string;
}

export interface DshTestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
}

export interface DshPatch {
  filename: string;
  diff: string;
}

export interface DshPortalAction {
  type: 'add_screen_feature' | 'update_mindmap_node' | 'update_stream' | 'general';
  summary: string;
  details?: Record<string, any>;
  applied?: boolean;
}

export interface DshExecutionResult {
  gateway: 'deepseek-harness';
  llm: 'gemini-3.8-flash';
  explanation: string;
  dshPlan: string[];
  patch: DshPatch;
  tests: DshTestResult[];
  portalAction: DshPortalAction;
  suggestedActions?: string[];
  isVoiceInput?: boolean;
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  agentName?: string;
  avatar?: string;
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  isVoice?: boolean;
  dshResult?: DshExecutionResult;
}

export type ChatMessage = AgentChatMessage;

export interface UxReviewComment {
  id: string;
  screenId: string;
  xPercent: number;
  yPercent: number;
  author: string;
  text: string;
  time: string;
  status: 'open' | 'addressed';
}
