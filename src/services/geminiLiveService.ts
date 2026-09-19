/**
 * Gemini Live API & Audio Streaming Service
 * Connects browser microphone to the Gemini Live WebSocket bridge
 * and provides real-time transcription and voice command detection.
 */

export interface LiveVoiceCallbacks {
  onTranscription: (text: string, isFinal: boolean) => void;
  onAudioLevel: (level: number) => void;
  onStatusChange: (
    status: 'idle' | 'connecting' | 'listening' | 'speaking' | 'error',
    message?: string
  ) => void;
  onAudioOutput?: (audioData: string) => void;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private callbacks: LiveVoiceCallbacks;
  private speechRecognizer: any = null;
  private isRunning: boolean = false;
  private currentTranscript: string = '';

  constructor(callbacks: LiveVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      this.callbacks.onStatusChange('connecting', 'Подключение к Gemini Live API...');

      // 1. Establish WebSocket connection to server Live API bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-audio`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Gemini Live WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ready') {
            this.callbacks.onStatusChange('listening', 'Gemini Live слушает микрофон (16kHz PCM)...');
          } else if (data.type === 'transcription' && data.text) {
            this.currentTranscript += (this.currentTranscript ? ' ' : '') + data.text;
            this.callbacks.onTranscription(this.currentTranscript, false);
          } else if (data.type === 'audio' && data.audio) {
            this.callbacks.onStatusChange('speaking', 'Ответ Gemini Live 3.8...');
            this.playPcmAudio(data.audio);
          } else if (data.type === 'interrupted') {
            // clear queue
          }
        } catch (e) {
          console.error('Error parsing WebSocket data', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Live WebSocket error, falling back to Web Speech / local Live bridge:', err);
      };

      this.ws.onclose = () => {
        console.log('Gemini Live WebSocket closed');
      };

      // 2. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.mediaStream = stream;

      // 3. AudioContext for 16kHz PCM Streaming
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      this.source = this.inputAudioCtx.createMediaStreamSource(stream);

      // ScriptProcessor to capture raw PCM
      this.processor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRunning) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Compute volume level for real-time visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const normalizedLevel = Math.min(1, rms * 5);
        this.callbacks.onAudioLevel(normalizedLevel);

        // Convert Float32 to Int16 PCM
        const base64Data = this.floatTo16BitPCMBase64(inputData);

        // Stream chunk via WebSocket if open
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'audio_chunk',
              audio: base64Data,
            })
          );
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      // 4. In-browser Speech Recognition for zero-latency client feedback
      this.initBrowserSpeechRecognition();

      this.isRunning = true;
      this.callbacks.onStatusChange('listening', 'Слушаю команду (Gemini Live 3.8)...');
      return true;
    } catch (err: any) {
      console.error('Failed to start Gemini Live voice capture:', err);
      this.callbacks.onStatusChange(
        'error',
        err.name === 'NotAllowedError'
          ? 'Доступ к микрофону заблокирован. Разрешите микрофон в браузере.'
          : 'Ошибка инициализации аудио: ' + (err.message || 'неизвестная ошибка')
      );
      this.stop();
      return false;
    }
  }

  private initBrowserSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onresult = (event: any) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              this.currentTranscript += (this.currentTranscript ? ' ' : '') + transcript;
            } else {
              interimText += transcript;
            }
          }
          const fullDisplay = this.currentTranscript + (interimText ? ' ' + interimText : '');
          this.callbacks.onTranscription(fullDisplay, false);

          if (this.ws && this.ws.readyState === WebSocket.OPEN && fullDisplay) {
            this.ws.send(
              JSON.stringify({
                type: 'voice_command_transcript',
                text: fullDisplay,
              })
            );
          }
        };

        recognition.onerror = (e: any) => {
          console.log('Speech recognition event:', e.error);
        };

        recognition.start();
        this.speechRecognizer = recognition;
      } catch (e) {
        console.warn('SpeechRecognition browser error:', e);
      }
    }
  }

  public stop(): string {
    const finalResult = this.currentTranscript.trim();
    this.isRunning = false;
    this.currentTranscript = '';

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch (e) {
        // ignore
      }
      this.speechRecognizer = null;
    }

    if (this.source && this.processor) {
      try {
        this.source.disconnect();
        this.processor.disconnect();
      } catch (e) {
        // ignore
      }
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {
        // ignore
      }
      this.inputAudioCtx = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.callbacks.onStatusChange('idle');
    this.callbacks.onAudioLevel(0);
    return finalResult;
  }

  private floatTo16BitPCMBase64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private playPcmAudio(base64Data: string) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.outputAudioCtx) {
        this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
      }

      const binary = window.atob(base64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);
      source.start();
    } catch (e) {
      console.warn('Error playing Live audio chunk:', e);
    }
  }
}
