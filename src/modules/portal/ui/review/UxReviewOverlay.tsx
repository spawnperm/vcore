import React from 'react';
import { UxReviewPin } from '../../domain/review/model';
import { X, MessageSquare } from 'lucide-react';

interface UxReviewOverlayProps {
  isReviewMode: boolean;
  pins: UxReviewPin[];
  pendingPinPos: { x: number; y: number } | null;
  newPinText: string;
  onNewPinTextChange: (text: string) => void;
  onSavePin: () => void;
  onCancelPendingPin: () => void;
  onDiscussWithAgent: (context: string) => void;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

export const UxReviewOverlay: React.FC<UxReviewOverlayProps> = ({
  isReviewMode,
  pins,
  pendingPinPos,
  newPinText,
  onNewPinTextChange,
  onSavePin,
  onCancelPendingPin,
  onDiscussWithAgent,
  onCanvasClick,
  children,
}) => {
  return (
    <div
      onClick={onCanvasClick}
      className={`flex-1 overflow-y-auto p-6 flex items-center justify-center bg-slate-950 relative ${
        isReviewMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      <div className="w-full flex items-center justify-center relative">
        {children}

        {/* Existing Pins */}
        {pins.map((pin) => (
          <div
            key={pin.id}
            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white text-white font-bold text-xs flex items-center justify-center shadow-lg cursor-pointer animate-bounce">
              !
            </div>
            {/* Tooltip Card */}
            <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-64 p-2.5 rounded-lg bg-slate-950 border border-rose-500/80 shadow-2xl text-xs z-50 text-slate-100">
              <div className="flex items-center justify-between text-[10px] text-rose-300 mb-1">
                <span className="font-semibold">{pin.author}</span>
                <span>{pin.time}</span>
              </div>
              <p className="text-slate-200">{pin.text}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscussWithAgent(`Заметка ревью: ${pin.text}`);
                }}
                className="mt-2 text-[10px] text-cyan-400 hover:underline block cursor-pointer"
              >
                💬 Передать UI-агенту →
              </button>
            </div>
          </div>
        ))}

        {/* Pending Pin Dialog */}
        {pendingPinPos && (
          <div
            style={{ left: `${pendingPinPos.x}%`, top: `${pendingPinPos.y}%` }}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-40 -translate-x-1/2 -translate-y-1/2 w-64 p-3 bg-slate-950 border border-cyan-500 rounded-xl shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-1.5 text-xs text-cyan-300 font-bold">
              <span>Добавить UX-заметку</span>
              <button
                onClick={onCancelPendingPin}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              autoFocus
              value={newPinText}
              onChange={(e) => onNewPinTextChange(e.target.value)}
              placeholder="Опишите замечание по дизайну или кнопке..."
              className="w-full h-16 p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 resize-none focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={onCancelPendingPin}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Отмена
              </button>
              <button
                onClick={onSavePin}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Прикрепить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
