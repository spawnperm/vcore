import React, { useState } from 'react';
import { DocItem, DocComment } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit3,
  MessageSquare,
  GitPullRequest,
  Download,
  Share2,
  Tag,
  ExternalLink,
  ChevronRight,
  Plus,
  Send,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface DocsTabProps {
  docs: DocItem[];
  selectedDocId: string;
  onSelectDoc: (docId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onOpenPrModal: () => void;
  onDiscussWithAgent: (docTitle: string) => void;
  onApproveDoc?: (docId: string) => void;
  onUpdateDoc?: (docId: string, updatedContent: string) => void;
}

export const DocsTab: React.FC<DocsTabProps> = ({
  docs,
  selectedDocId,
  onSelectDoc,
  onSelectNode,
  onOpenPrModal,
  onDiscussWithAgent,
  onApproveDoc,
  onUpdateDoc,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [comments, setComments] = useState<DocComment[]>([
    {
      id: 'c1',
      author: 'Иван Петров (Архитектор)',
      avatar: 'ИП',
      text: 'Проверьте время таймаута compensator: если банк не отвечает 15 секунд, не должно быть зависания.',
      timestamp: '10 мин назад',
    },
    {
      id: 'c2',
      author: 'SecOps-агент',
      avatar: '🤖',
      text: 'В OpenAPI спецификации необходимо подтвердить маскирование поля pan_number в логах.',
      timestamp: '4 мин назад',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportFeedback, setExportFeedback] = useState('');

  const currentDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleStartEdit = () => {
    setEditedContent(currentDoc.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdateDoc) {
      onUpdateDoc(currentDoc.id, editedContent);
    } else {
      currentDoc.content = editedContent;
    }
    setIsEditing(false);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: DocComment = {
      id: `c-${Date.now()}`,
      author: 'Иван Петров',
      avatar: 'ИП',
      text: newCommentText,
      timestamp: 'Только что',
    };
    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleExport = (format: string) => {
    setExportFeedback(`Экспортировано в формате ${format.toUpperCase()}`);
    setTimeout(() => setExportFeedback(''), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left Area: Main Document Content */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Document Action Header */}
        <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <FileText className="w-4 h-4" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100 truncate">
                  {currentDoc.title}
                </span>
                {currentDoc.status === 'draft' ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    🔄 черновик (генерируется)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ✅ утверждён
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {exportFeedback && (
              <span className="text-xs text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 animate-fade">
                {exportFeedback}
              </span>
            )}
            <button
              onClick={() => handleExport('md')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Экспорт Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Скопировать текст"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {currentDoc.status === 'draft' && onApproveDoc && (
              <button
                onClick={() => onApproveDoc(currentDoc.id)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Утвердить ADR</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-500">Автор:</span>{' '}
              <span className="text-slate-200 font-medium">{currentDoc.author}</span>
            </div>
            <div>
              <span className="text-slate-500">Связано с планом:</span>{' '}
              <span className="space-x-1.5">
                {currentDoc.relatedNodes.map((nid) => (
                  <button
                    key={nid}
                    onClick={() => onSelectNode(nid)}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px]"
                  >
                    🧩 {nid}
                  </button>
                ))}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Изменён:</span>{' '}
              <span className="font-mono text-[11px] text-slate-300">{currentDoc.lastModified}</span>
            </div>
          </div>

          {/* Quick tags */}
          <div className="flex items-center gap-1">
            {currentDoc.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Document Content View / Editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isEditing ? (
            <div className="h-full flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-semibold">Режим редактирования Markdown:</span>
                <div className="space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 rounded bg-cyan-600 text-white font-medium hover:bg-cyan-500"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          ) : (
            <div className="max-w-3xl prose prose-invert prose-cyan text-sm leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 text-slate-200">
                {currentDoc.content}
              </pre>
            </div>
          )}

          {/* Bottom Interactive Toolbar */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>✏️ Править</span>
            </button>

            <button
              onClick={() => onDiscussWithAgent(currentDoc.title)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>💬 Обсудить с агентом</span>
            </button>

            <button
              onClick={onOpenPrModal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
              <span>🔗 PR #4822</span>
            </button>
          </div>

          {/* In-text Live Review Comments Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Ревью в реальном времени ({comments.length})
            </h4>

            {/* Add new comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Оставьте комментарий к разделу (агент учтёт правку)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Отправить</span>
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{c.author}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Table of Contents (Содержание) matching prompt ASCII */}
      <div className="w-72 lg:w-80 bg-slate-900/90 flex flex-col shrink-0 select-none overflow-y-auto">
        <div className="p-3 border-b border-slate-800 font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Содержание документации</span>
          <span className="text-[10px] text-cyan-400 font-mono">Live Docs</span>
        </div>

        <div className="p-3 space-y-4 text-xs">
          {/* Group 1: Архитектура (ADR) */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>├── Архитектура (ADR)</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {docs
                .filter((d) => d.type === 'adr')
                .map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => onSelectDoc(doc.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{doc.title.split(':')[0]}</span>
                      {doc.status === 'draft' ? (
                        <span className="text-[10px] text-amber-400 shrink-0 font-mono">🔄 draft</span>
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Group 2: API (OpenAPI) */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>├── API (OpenAPI 3.0)</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {docs
                .filter((d) => d.type === 'api')
                .map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => onSelectDoc(doc.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{doc.title.split('—')[0]}</span>
                      {doc.status === 'draft' ? (
                        <span className="text-[10px] text-amber-400 shrink-0 font-mono">🔄</span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 shrink-0 font-mono">✅</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Group 3: CHANGELOG */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>├── CHANGELOG</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {docs
                .filter((d) => d.type === 'changelog')
                .map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => onSelectDoc(doc.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{doc.title}</span>
                      <span className="text-[10px] text-amber-400 shrink-0 font-mono">🔄</span>
                    </button>
                  );
                })}
              <div className="text-slate-500 p-1.5 text-[11px] flex items-center justify-between">
                <span>v2.3.1</span>
                <span className="text-emerald-400">✅</span>
              </div>
            </div>
          </div>

          {/* Group 4: Guides & FAQ */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>└── Руководства & FAQ</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2 text-slate-400">
              <div className="p-1.5 hover:text-white cursor-pointer">Руководство администратора</div>
              <div className="p-1.5 hover:text-white cursor-pointer">Руководство пользователя</div>
              <div className="p-1.5 hover:text-white cursor-pointer">Часто задаваемые вопросы (FAQ)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
