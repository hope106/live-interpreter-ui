export type InitConfig = {
  language: string;
  useWhisper: boolean;
  sampleRate: number;
};

export type SpeechState = 'speaking' | 'silent' | 'processing';

export type ServerMessage =
  | { type: 'connected'; sessionId: string }
  | { type: 'input_transcription'; text: string; isFinal?: boolean; language?: string }
  | { type: 'output_transcription'; text: string; isFinal?: boolean; language?: string }
  | { type: 'audio_response'; data: string; sampleRate: number }
  | { type: 'turn_complete'; inputText: string; outputText: string }
  | { type: 'speech_state'; state: SpeechState; timestamp: number }
  | { type: 'error'; message: string; code?: string }
  | { type: string; [key: string]: unknown };

type CallbackMap = {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage: (message: ServerMessage) => void;
  onError: (error: Event | CloseEvent) => void;
};

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private initConfig: InitConfig | null = null;
  private shouldReconnect = true;

  constructor(private url: string, private callbacks: CallbackMap) {}

  connect(config: InitConfig) {
    this.initConfig = config;
    this.shouldReconnect = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.callbacks.onOpen?.();
      this.send({ type: 'init', config });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        this.callbacks.onMessage(data);
      } catch (err) {
        console.error('Malformed WebSocket message', err);
      }
    };

    this.ws.onerror = (event) => {
      this.callbacks.onError(event);
    };

    this.ws.onclose = (event) => {
      this.callbacks.onClose?.();
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      } else {
        this.clearReconnectTimer();
      }
    };
  }

  send(data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendAudioData(base64Data: string, timestamp: number) {
    this.send({ type: 'audio', data: base64Data, timestamp });
  }

  interrupt() {
    this.send({ type: 'interrupt' });
  }

  disconnect(options?: { notifyServer?: boolean }) {
    const notifyServer = options?.notifyServer ?? false;
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.ws) {
      if (notifyServer) {
        this.send({ type: 'close' });
      }
      this.ws.close();
      this.ws = null;
    }
  }

  isReconnectEnabled() {
    return this.shouldReconnect;
  }

  private scheduleReconnect() {
    if (!this.initConfig) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError(new Event('Maximum reconnect attempts reached'));
      return;
    }
    this.reconnectAttempts += 1;
    const delay = 2000 * this.reconnectAttempts;
    this.clearReconnectTimer();
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.initConfig) return;
      this.connect(this.initConfig);
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
