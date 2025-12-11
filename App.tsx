import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Settings2, Power, AlertCircle, Volume2 } from 'lucide-react';
import { ConnectionState, ChatMessage, SpeechState } from './types';
import { createPcmBlob, decodeAudioData, PCM_SAMPLE_RATE, base64ToArrayBuffer } from './utils/audioUtils';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import SpeechStateIndicator from './components/SpeechStateIndicator';
import { WebSocketService, ServerMessage } from './services/WebSocketService';

function App() {
  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Split streaming text to prevent conflicts
  const [streamingUserText, setStreamingUserText] = useState<string>('');
  const [streamingModelText, setStreamingModelText] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [speechState, setSpeechState] = useState<SpeechState>('silent');
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Refs for Audio Handling
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  
  // Audio Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Visualizer Refs
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const [inputAnalyserState, setInputAnalyserState] = useState<AnalyserNode | null>(null);
  const [outputAnalyserState, setOutputAnalyserState] = useState<AnalyserNode | null>(null);

  const wsServiceRef = useRef<WebSocketService | null>(null);
  const firstTurnCompletedRef = useRef(false);
  const secondSpeechLoggedRef = useRef(false);

  // Cleanup audio resources
  const stopAudio = useCallback(() => {
    // Stop microphone stream
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop output
    activeSourcesRef.current.forEach(source => source.stop());
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    setInputAnalyserState(null);
    setOutputAnalyserState(null);
  }, []);

  const cleanupConnection = useCallback((state: ConnectionState = ConnectionState.DISCONNECTED) => {
    stopAudio();
    setConnectionState(state);
    setStreamingUserText('');
    setStreamingModelText('');
    firstTurnCompletedRef.current = false;
    secondSpeechLoggedRef.current = false;
  }, [stopAudio]);

  const handleDisconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect({ notifyServer: true });
      wsServiceRef.current = null;
    }
    cleanupConnection();
  }, [cleanupConnection]);

  const commitMessage = useCallback((role: 'user' | 'model', text: string) => {
    if (!text.trim()) return;
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${role}`,
      role,
      text: text.trim(),
      timestamp: new Date(),
      isFinal: true
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleWebSocketMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'connected':
        setConnectionState(ConnectionState.CONNECTED);
        setError(null);
        break;
      case 'input_transcription':
        if (message.isFinal) {
          commitMessage('user', message.text || '');
          setStreamingUserText('');
        } else {
          setStreamingUserText(message.text || '');
        }
        break;
      case 'output_transcription':
        if (message.isFinal) {
          commitMessage('model', message.text || '');
          setStreamingModelText('');
        } else {
          setStreamingModelText(message.text || '');
        }
        break;
      case 'audio_response':
        if (message.data && outputAudioContextRef.current && outputGainRef.current) {
          const ctx = outputAudioContextRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          decodeAudioData(base64ToArrayBuffer(message.data), ctx)
            .then(buffer => {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputGainRef.current!);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            })
            .catch(err => console.error('Audio decode error', err));
        }
        break;
      case 'turn_complete':
        setStreamingUserText('');
        setStreamingModelText('');
        if (!firstTurnCompletedRef.current) {
          firstTurnCompletedRef.current = true;
          secondSpeechLoggedRef.current = false;
        }
        break;
      case 'speech_state':
        setSpeechState(message.state);
        break;
      case 'error':
        setError(message.message || 'WebSocket error');
        setConnectionState(ConnectionState.ERROR);
        break;
      default:
        break;
    }
  }, [commitMessage]);

  const handleWebSocketError = useCallback((errorEvent: Event | CloseEvent) => {
    console.error('WebSocket error', errorEvent);
    setError('WebSocket connection error');
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
    cleanupConnection(ConnectionState.ERROR);
  }, [cleanupConnection]);

  const handleWebSocketClose = useCallback(() => {
    const shouldReconnect = wsServiceRef.current?.isReconnectEnabled();
    if (shouldReconnect) {
      setConnectionState(ConnectionState.CONNECTING);
      return;
    }
    stopAudio();
    setConnectionState(ConnectionState.DISCONNECTED);
    setStreamingUserText('');
    setStreamingModelText('');
  }, [stopAudio]);

  const connectToBackend = async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      // 1. Initialize Audio Contexts
      const InputContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new InputContextClass({ sampleRate: PCM_SAMPLE_RATE });
      const outputCtx = new InputContextClass({ sampleRate: 24000 }); // Model output is 24kHz

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // Output Chain
      const outGain = outputCtx.createGain();
      outGain.gain.value = volume;
      outGain.connect(outputCtx.destination);
      outputGainRef.current = outGain;

      // Output Visualizer
      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 256;
      outGain.connect(outAnalyser); 
      outputAnalyserRef.current = outAnalyser;
      setOutputAnalyserState(outAnalyser);

      // Input Visualizer Setup (will connect after getUserMedia)
      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 256;
      inputAnalyserRef.current = inAnalyser;
      setInputAnalyserState(inAnalyser);

      // 2. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Microphone Stream
      const source = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(inAnalyser);

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const packet = createPcmBlob(inputData);
        if (firstTurnCompletedRef.current && !secondSpeechLoggedRef.current) {
          console.log('2번째 음성을 보낸다.');
          secondSpeechLoggedRef.current = true;
        }
        if (packet.data && wsServiceRef.current) {
          wsServiceRef.current.sendAudioData(packet.data, Date.now());
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
      const wsService = new WebSocketService(wsUrl, {
        onMessage: handleWebSocketMessage,
        onError: handleWebSocketError,
        onClose: handleWebSocketClose,
        onOpen: () => {
          console.log('WebSocket connected');
        }
      });
      wsServiceRef.current = wsService;
      wsService.connect({
        language: 'auto',
        useWhisper: false,
        sampleRate: PCM_SAMPLE_RATE
      });

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to initialize");
      setConnectionState(ConnectionState.ERROR);
      stopAudio();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const v = parseFloat(e.target.value);
     setVolume(v);
     if (outputGainRef.current) {
         outputGainRef.current.gain.value = v;
     }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Settings2 className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Gemini Live Interpreter</h1>
            <p className="text-xs text-zinc-400">Korean <span className="text-zinc-600">⇄</span> English</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${
                connectionState === ConnectionState.CONNECTED 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : connectionState === ConnectionState.CONNECTING
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
                <div className={`w-2 h-2 rounded-full ${
                    connectionState === ConnectionState.CONNECTED ? 'bg-green-500 animate-pulse' : 
                    connectionState === ConnectionState.CONNECTING ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-500'
                }`} />
                {connectionState}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Visualizers & Controls (Left Panel on Desktop) */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 p-6 flex flex-col gap-6 bg-zinc-900/30">
            
            {/* Control Center */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Audio Control</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={connectionState === ConnectionState.CONNECTED ? handleDisconnect : connectToBackend}
                        disabled={connectionState === ConnectionState.CONNECTING}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                            connectionState === ConnectionState.CONNECTED
                            ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750 hover:border-blue-500/50 hover:text-blue-400'
                        }`}
                    >
                        <Power className={`w-8 h-8 mb-2 ${connectionState === ConnectionState.CONNECTED ? 'text-red-500' : ''}`} />
                        <span className="text-sm font-medium">
                            {connectionState === ConnectionState.CONNECTED ? 'Stop Session' : 'Start Session'}
                        </span>
                    </button>

                    <button 
                        onClick={toggleMute}
                        disabled={connectionState !== ConnectionState.CONNECTED}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                            isMuted 
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                        } ${connectionState !== ConnectionState.CONNECTED ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isMuted ? <MicOff className="w-8 h-8 mb-2" /> : <Mic className="w-8 h-8 mb-2" />}
                        <span className="text-sm font-medium">{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>
                </div>

                 {/* Volume Slider */}
                 <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={16} className="text-zinc-400"/>
                        <span className="text-xs font-medium text-zinc-400">Output Volume</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>

            {/* Speech State Indicator */}
            {connectionState === ConnectionState.CONNECTED && (
                <div>
                    <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Speech Status</h2>
                    <SpeechStateIndicator state={speechState} />
                </div>
            )}

            {/* Live Visualizers */}
            <div className="flex flex-col gap-4 mt-auto">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Input (You)</span>
                        {isMuted && <span className="text-xs text-orange-400 bg-orange-900/30 px-1.5 rounded">MUTED</span>}
                    </div>
                    <Visualizer analyser={inputAnalyserState} isActive={connectionState === ConnectionState.CONNECTED && !isMuted} color="#a1a1aa" />
                </div>

                <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Output (AI Interpreter)</span>
                    <Visualizer analyser={outputAnalyserState} isActive={connectionState === ConnectionState.CONNECTED} color="#3b82f6" />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200">{error}</p>
                </div>
            )}
        </div>

        {/* Transcript Area */}
        <div className="flex-1 bg-zinc-950 relative">
            <div className="absolute inset-0">
                <Transcript messages={messages} userText={streamingUserText} modelText={streamingModelText} />
            </div>
            
            {/* Status Overlay */}
            {connectionState === ConnectionState.DISCONNECTED && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10 pointer-events-none">
                     <p className="text-zinc-400 text-sm animate-pulse">Press 'Start Session' to begin interpreting</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;
