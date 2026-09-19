import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Cpu,
  Volume2,
  VolumeX,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GeminiLiveService } from '../services/geminiLiveService';

interface LiveVoiceControlProps {
  onSendCommand: (command: string, isVoice: boolean) => void;
  isProcessing?: boolean;
}

export const LiveVoiceControl: React.FC<LiveVoiceControlProps> = ({
  onSendCommand,
  isProcessing = false,
}) => {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  // Initialize service
  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService({
      onTranscription: (text) => {
        setTranscript(text);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onStatusChange: (status, message) => {
        setLiveStatus(status);
        if (message) setStatusMessage(message);
      },
    });

    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.stop();
      }
    };
  }, []);

  const handleToggleLive = async () => {
    if (isLiveActive) {
      // Stop recording
      if (liveServiceRef.current) {
        const finalTranscript = liveServiceRef.current.stop();
        setIsLiveActive(false);
        if (finalTranscript) {
          // Auto-send if non-empty
          onSendCommand(finalTranscript, true);
          setTranscript('');
        }
      }
    } else {
      // Start recording
      setTranscript('');
      setIsLiveActive(true);
      if (liveServiceRef.current) {
        const success = await liveServiceRef.current.start();
        if (!success) {
          setIsLiveActive(false);
        }
      }
    }
  };

  const handleSendManual = () => {
    if (!transcript.trim()) return;
    if (liveServiceRef.current && isLiveActive) {
      liveServiceRef.current.stop();
      setIsLiveActive(false);
    }
    onSendCommand(transcript.trim(), true);
    setTranscript('');
  };

  const handleCancel = () => {
    if (liveServiceRef.current && isLiveActive) {
      liveServiceRef.current.stop();
      setIsLiveActive(false);
    }
    setTranscript('');
    setLiveStatus('idle');
  };

  // Preset voice commands to simulate or trigger quickly
  const quickVoicePrompts = [
    'Добавь двухфакторную верификацию в форму возврата на экране заказов',
    'Включи Circuit Breaker для банковского шлюза со SLA 380 ms',
    'Синтезируй Saga-компенсатор и обнови ADR-042',
    'Сгенерируй тестовый раннер dsh-runner для Kafka',
  ];

  return (
    <div className="rounded-xl border border-cyan-800/80 bg-slate-950/90 p-3 shadow-lg shadow-cyan-950/30 text-xs">
      {/* Top Banner: Status and Badges */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg flex items-center justify-center ${
            isLiveActive ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-cyan-950 text-cyan-400'
          }`}>
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span>Gemini Live API</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                gemini-3.8-live
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <span>Шлюз:</span>
              <span className="text-emerald-400 font-semibold">deepseek-harness</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300">gemini-3.8-flash</span>
            </div>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
          className={`p-1.5 rounded-md border transition-colors ${
            audioFeedbackEnabled
              ? 'bg-slate-800 text-cyan-400 border-slate-700'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={audioFeedbackEnabled ? 'Звук Gemini включен' : 'Звук отключен'}
        >
          {audioFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Real-time Waveform Equalizer when live */}
      {isLiveActive && (
        <div className="mb-2 p-2 bg-slate-900/80 rounded-lg border border-cyan-900/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-rose-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Идёт голосовой ввод через Live API...
            </span>
            <span className="text-slate-400 font-mono text-[10px]">16kHz PCM</span>
          </div>

          {/* Animated visual bars */}
          <div className="h-6 flex items-end justify-center gap-1 px-2 py-1 bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden">
            {[0.2, 0.4, 0.7, 0.9, 0.6, 0.8, 1.0, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.2].map((factor, i) => {
              const height = Math.max(15, Math.min(100, (audioLevel * factor * 140) + 15));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-cyan-600 to-rose-400 transition-all duration-75"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Spoken Transcript or Status */}
      {isLiveActive ? (
        <div className="mb-2">
          <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
            Распознанная команда (Gemini Live):
          </label>
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 min-h-[44px] text-slate-200 font-medium text-xs leading-relaxed flex items-center">
            {transcript ? (
              <span className="text-cyan-300">{transcript}</span>
            ) : (
              <span className="text-slate-500 italic">Слушаю вас... Говорите команду для DSH</span>
            )}
          </div>

          {/* Action buttons during speech */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Отмена
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleLive}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-sm"
              >
                <MicOff className="w-3 h-3" />
                Завершить и передать в DSH
              </button>
              {transcript.trim() && (
                <button
                  onClick={handleSendManual}
                  className="px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Отправить
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Inactive: Big Primary Microphone Button */
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              id="gemini-live-mic-btn"
              onClick={handleToggleLive}
              disabled={isProcessing}
              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-cyan-950/50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Включить голосовой ввод (Gemini Live)</span>
            </button>
          </div>

          {/* Quick Voice Prompt presets */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Быстрые голосовые команды DSH:</span>
              <span className="text-cyan-400 font-mono">DSH Gateway Ready</span>
            </div>
            <div className="flex flex-col gap-1">
              {quickVoicePrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendCommand(prompt, true)}
                  disabled={isProcessing}
                  className="text-left px-2 py-1 rounded bg-slate-900/90 hover:bg-cyan-950 hover:border-cyan-800 text-slate-300 hover:text-cyan-200 border border-slate-800/80 transition-colors truncate text-[11px] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error or Notice Alert */}
      {liveStatus === 'error' && (
        <div className="mt-2 p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[10px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{statusMessage || 'Ошибка голосового сервиса'}</span>
        </div>
      )}
    </div>
  );
};
