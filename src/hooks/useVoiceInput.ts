import { useState, useEffect, useRef, useCallback } from 'react';

// TypeScript declaration for browser SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

export interface UseVoiceInputOptions {
  /**
   * Callback to receive recognized text directly.
   * Matches handleSendMessage(text: string, isVoice?: boolean) in App.tsx.
   */
  onSendMessage: (text: string, isVoice?: boolean) => void;
  /** Language for recognition, default 'ru-RU' */
  lang?: string;
  /** Continuous listening mode, default true */
  continuous?: boolean;
  /** Whether to automatically send the message when speech pauses or stops, default true */
  autoSendOnStop?: boolean;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  fullTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: (shouldSend?: boolean) => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

/**
 * Custom React hook that uses the browser's Web Speech API to capture
 * voice input, transcribe it into text, and pass it directly to handleSendMessage in App.tsx.
 */
export function useVoiceInput({
  onSendMessage,
  lang = 'ru-RU',
  continuous = true,
  autoSendOnStop = true,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');
  const isExplicitStopRef = useRef<boolean>(false);
  const shouldSendOnStopRef = useRef<boolean>(autoSendOnStop);
  const onSendMessageRef = useRef(onSendMessage);

  // Keep latest onSendMessage reference without triggering effect re-binds
  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );

  // Initialize and clean up SpeechRecognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let currentFinal = transcriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const textChunk = result[0]?.transcript || '';

          if (result.isFinal) {
            currentFinal += (currentFinal ? ' ' : '') + textChunk.trim();
          } else {
            currentInterim += (currentInterim ? ' ' : '') + textChunk;
          }
        }

        transcriptRef.current = currentFinal;
        setTranscript(currentFinal);
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Web Speech API recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Доступ к микрофону заблокирован в настройках браузера.');
        } else if (event.error === 'no-speech') {
          // ignore silent pause
        } else {
          setError(`Ошибка распознавания речи: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');

        const finalSpokenText = transcriptRef.current.trim();
        // If user stopped or recognition ended and we have captured speech, pass it directly to handleSendMessage
        if (shouldSendOnStopRef.current && finalSpokenText) {
          onSendMessageRef.current(finalSpokenText, true);
          transcriptRef.current = '';
          setTranscript('');
        }

        shouldSendOnStopRef.current = autoSendOnStop;
        isExplicitStopRef.current = false;
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      console.error('Error creating SpeechRecognition instance:', e);
      setError('Не удалось инициализировать Web Speech API');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [isSupported, continuous, lang, autoSendOnStop]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Ваш браузер не поддерживает Web Speech API');
      return;
    }

    setError(null);
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    shouldSendOnStopRef.current = autoSendOnStop;
    isExplicitStopRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        // If already started, stop then restart
        if (err.name === 'InvalidStateError') {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current?.start();
            }, 100);
          } catch {
            // ignore
          }
        } else {
          setError(err.message || 'Ошибка запуска распознавания речи');
        }
      }
    }
  }, [isSupported, autoSendOnStop]);

  const stopListening = useCallback((shouldSend: boolean = true) => {
    shouldSendOnStopRef.current = shouldSend;
    isExplicitStopRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening(true);
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const fullTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
