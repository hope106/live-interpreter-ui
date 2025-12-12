# Gemini Live Interpreter - Technical Analysis

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [UI 구성 및 화면 구조](#ui-구성-및-화면-구조)
4. [음성 전달 메커니즘](#음성-전달-메커니즘)
5. [백엔드 통신 프로토콜](#백엔드-통신-프로토콜)
6. [주요 컴포넌트 상세 분석](#주요-컴포넌트-상세-분석)
7. [데이터 흐름도](#데이터-흐름도)
8. [기술 스택](#기술-스택)

---

## 프로젝트 개요

### 목적
**Gemini Live Interpreter**는 Google의 Gemini Live API를 활용한 실시간 양방향 음성 통역 애플리케이션입니다. 한국어와 영어 간의 실시간 통역을 제공하며, 사용자가 말한 내용을 즉시 상대 언어로 변환하여 음성과 텍스트로 출력합니다.

### 핵심 기능
- ✅ **실시간 음성 입력**: 마이크를 통한 연속적인 음성 스트리밍
- ✅ **실시간 음성 출력**: AI 통역 결과의 즉각적인 음성 재생
- ✅ **실시간 텍스트 전사**: 사용자 입력과 AI 응답의 텍스트 변환 표시
- ✅ **오디오 시각화**: 입력/출력 오디오의 실시간 파형 표시
- ✅ **양방향 스트리밍**: WebSocket을 통한 full-duplex 통신
- ✅ **음성 상태 추적**: 말하기/듣기/처리 중 상태 실시간 표시

### 설계 의도
1. **저지연 통신**: WebSocket 기반 실시간 양방향 스트리밍으로 통역 지연 최소화
2. **사용자 친화적 UI**: 직관적인 인터페이스로 누구나 쉽게 사용 가능
3. **시각적 피드백**: 오디오 시각화 및 상태 표시로 시스템 동작 투명성 확보
4. **확장 가능한 아키텍처**: 컴포넌트 기반 설계로 유지보수 및 기능 추가 용이

---

## 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Frontend)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      App.tsx (Main)                        │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ WebSocket       │  │ Audio Input  │  │ Audio Output │  │  │
│  │  │ Service         │  │ Processing   │  │ Playback     │  │  │
│  │  └─────────────────┘  └──────────────┘  └──────────────┘  │  │
│  │           │                   │                  │          │  │
│  │  ┌────────▼───────────────────▼──────────────────▼──────┐  │  │
│  │  │            State Management (React Hooks)            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │           │                                                  │  │
│  │  ┌────────▼─────────────────────────────────────────────┐  │  │
│  │  │  UI Components (Transcript, Visualizer, Controls)    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ WebSocket (ws://)
                               │ JSON + Base64 Audio
┌──────────────────────────────▼──────────────────────────────────┐
│                    Backend Server (Python)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  WebSocket Handler                         │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Audio Stream    │  │ Gemini Live  │  │ Response     │  │  │
│  │  │ Receiver        │  │ API Client   │  │ Broadcaster  │  │  │
│  │  └─────────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ gRPC Streaming
                             │ Bidirectional
┌────────────────────────────▼────────────────────────────────────┐
│                  Google Gemini Live API                          │
│  • Real-time Speech Recognition (STT)                            │
│  • Language Translation (KO ↔ EN)                                │
│  • Text-to-Speech Synthesis (TTS)                                │
└──────────────────────────────────────────────────────────────────┘
```

### 레이어 구조

#### 1. 프레젠테이션 레이어 (UI Components)
- **Transcript.tsx**: 대화 내용 텍스트 표시
- **Visualizer.tsx**: 오디오 파형 시각화
- **SpeechStateIndicator.tsx**: 음성 상태 표시

#### 2. 애플리케이션 레이어 (App.tsx)
- 전체 애플리케이션 상태 관리
- 오디오 입출력 제어
- WebSocket 연결 관리
- 이벤트 핸들링 및 오케스트레이션

#### 3. 서비스 레이어 (WebSocketService)
- WebSocket 연결 생명주기 관리
- 메시지 송수신 처리
- 자동 재연결 로직

#### 4. 유틸리티 레이어 (audioUtils)
- 오디오 데이터 포맷 변환
- PCM 인코딩/디코딩
- Base64 인코딩/디코딩

---

## UI 구성 및 화면 구조

### 레이아웃 구조

애플리케이션은 **3단 레이아웃**으로 구성됩니다:

```
┌──────────────────────────────────────────────────────────┐
│                      Header (고정)                         │
│  • Title: "Gemini Live Interpreter"                      │
│  • Language Indicator: "Korean ⇄ English"                │
│  • Connection Status Badge                               │
└──────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────┐
│   Left Panel (1/3)     │   Right Panel (2/3)             │
│  ┌──────────────────┐  │  ┌───────────────────────────┐  │
│  │ Control Buttons  │  │  │                           │  │
│  │ • Start/Stop     │  │  │   Transcript Area         │  │
│  │ • Mute/Unmute    │  │  │   (Scrollable)            │  │
│  ├──────────────────┤  │  │                           │  │
│  │ Volume Slider    │  │  │   • User Messages         │  │
│  ├──────────────────┤  │  │   • AI Messages           │  │
│  │ Speech State     │  │  │   • Streaming Text        │  │
│  │ Indicator        │  │  │                           │  │
│  ├──────────────────┤  │  │                           │  │
│  │ Input Visualizer │  │  │                           │  │
│  ├──────────────────┤  │  │                           │  │
│  │ Output Visualizer│  │  │                           │  │
│  └──────────────────┘  │  └───────────────────────────┘  │
└────────────────────────┴─────────────────────────────────┘
```

### 1. Header (헤더)

**위치**: 화면 상단 고정 (`sticky top-0`)

**구성 요소**:
```tsx
<header className="px-6 py-4 border-b border-zinc-800 ...">
  {/* Left Section */}
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-blue-600">
      <Settings2 /> {/* Logo Icon */}
    </div>
    <div>
      <h1>Gemini Live Interpreter</h1>
      <p>Korean ⇄ English</p>
    </div>
  </div>

  {/* Right Section */}
  <div className="flex items-center gap-4">
    <ConnectionStatusBadge /> {/* CONNECTED/CONNECTING/DISCONNECTED */}
  </div>
</header>
```

**기능**:
- 애플리케이션 브랜딩 표시
- 지원 언어 쌍 명시 (한국어 ⇄ 영어)
- 실시간 연결 상태 표시 (초록색: 연결됨, 노란색: 연결 중, 회색: 연결 끊김)

### 2. Left Panel (좌측 제어 패널)

**위치**: 데스크톱에서 화면 왼쪽 1/3, 모바일에서 상단

**구성 요소**:

#### A. Control Center (제어 센터)
```tsx
<div className="grid grid-cols-2 gap-3">
  {/* Start/Stop Session Button */}
  <button onClick={toggle}>
    <Power />
    {connected ? 'Stop Session' : 'Start Session'}
  </button>

  {/* Mute/Unmute Button */}
  <button onClick={toggleMute}>
    {isMuted ? <MicOff /> : <Mic />}
    {isMuted ? 'Unmute Mic' : 'Mute Mic'}
  </button>
</div>
```

**기능**:
- **Start/Stop Session**: WebSocket 연결 및 오디오 스트림 시작/종료
- **Mute/Unmute Mic**: 마이크 음소거 토글 (연결 중에만 활성화)

#### B. Volume Slider (볼륨 조절)
```tsx
<input
  type="range"
  min="0"
  max="1.5"
  step="0.05"
  value={volume}
  onChange={handleVolumeChange}
/>
```

**기능**:
- AI 응답 음성 출력 볼륨 실시간 조절 (0% ~ 150%)
- 즉각 반영 (GainNode를 통한 오디오 증폭 제어)

#### C. Speech State Indicator (음성 상태 표시)
```tsx
<SpeechStateIndicator state={speechState} />
```

**3가지 상태**:
- 🎤 **Speaking** (말씀하세요...): 사용자가 말할 수 있는 상태
- 👂 **Silent** (듣고 있습니다...): AI가 응답 중이거나 대기 중
- ⏳ **Processing** (처리 중...): AI가 입력을 분석하는 중

#### D. Audio Visualizers (오디오 시각화)

**Input Visualizer** (사용자 입력):
```tsx
<Visualizer
  analyser={inputAnalyserState}
  isActive={connected && !isMuted}
  color="#a1a1aa" // 회색
/>
```

**Output Visualizer** (AI 출력):
```tsx
<Visualizer
  analyser={outputAnalyserState}
  isActive={connected}
  color="#3b82f6" // 파란색
/>
```

**시각화 원리**:
- Web Audio API의 `AnalyserNode` 사용
- `getByteTimeDomainData()`로 시간 도메인 데이터 추출
- Canvas API로 실시간 파형 렌더링 (60fps)
- 연결 해제 시 평평한 선 표시

### 3. Right Panel (우측 대화 패널)

**위치**: 데스크톱에서 화면 오른쪽 2/3, 모바일에서 하단

**구성 요소**:

#### Transcript Component (대화 내용)

```tsx
<Transcript
  messages={messages}          // 확정된 메시지 목록
  userText={streamingUserText} // 실시간 사용자 입력 (임시)
  modelText={streamingModelText} // 실시간 AI 응답 (임시)
/>
```

**메시지 표시 방식**:

1. **사용자 메시지** (우측 정렬):
```tsx
<div className="flex gap-3 justify-end">
  <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm">
    {msg.text}
  </div>
  <User icon /> {/* 회색 아이콘 */}
</div>
```

2. **AI 메시지** (좌측 정렬):
```tsx
<div className="flex gap-3 justify-start">
  <Bot icon /> {/* 파란색 아이콘 */}
  <div className="bg-blue-950/40 border border-blue-900/50 text-blue-100 rounded-2xl rounded-tl-sm">
    {msg.text}
  </div>
</div>
```

3. **스트리밍 중인 텍스트** (반투명 + 깜빡이는 커서):
```tsx
{userText.trim() && (
  <div className="opacity-80 bg-zinc-800/80">
    {userText}
    <span className="animate-pulse">|</span> {/* 타이핑 커서 */}
  </div>
)}
```

**자동 스크롤**:
```tsx
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, userText, modelText]);
```
- 새로운 메시지나 스트리밍 텍스트가 업데이트될 때마다 자동으로 하단으로 스크롤

**빈 화면 표시**:
```tsx
{messages.length === 0 && !userText && !modelText && (
  <div className="flex flex-col items-center justify-center">
    <Bot className="w-12 h-12" />
    <p>Ready to interpret.</p>
    <p>Speak Korean or English.</p>
  </div>
)}
```

### 색상 및 디자인 시스템

**테마**: Dark Mode (Zinc/Blue Palette)

**주요 색상**:
- 배경: `bg-zinc-950` (거의 검정)
- 패널: `bg-zinc-900` (어두운 회색)
- 사용자 메시지: `bg-zinc-800` (중간 회색)
- AI 메시지: `bg-blue-950/40` (반투명 파랑)
- 강조 색상: `text-blue-400`, `border-blue-500`

**시각적 피드백**:
- 연결 상태: 초록색(연결)/노란색(연결 중)/회색(연결 끊김)
- 음성 상태: 초록색(speaking)/회색(silent)/파란색(processing)
- 애니메이션: `animate-pulse` (상태 표시), `animate-spin-slow` (처리 중)

---

## 음성 전달 메커니즘

### 음성 입력 처리 Flow

```
┌──────────────┐
│ Microphone   │
│ (Hardware)   │
└──────┬───────┘
       │ getUserMedia()
       ▼
┌──────────────────────────────────────┐
│  MediaStream                         │
│  (Raw Audio from Browser)            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  MediaStreamAudioSourceNode          │
│  (Web Audio API Input)               │
└──────┬───────────────────────────────┘
       │
       ├────────────────────┐
       ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  AnalyserNode   │  │ ScriptProcessor │
│  (Visualization)│  │  Node (Audio    │
│                 │  │   Processing)   │
└─────────────────┘  └─────┬───────────┘
                            │ onaudioprocess event
                            ▼
                     ┌──────────────────┐
                     │ Float32Array     │
                     │ (4096 samples)   │
                     └─────┬────────────┘
                            │ floatTo16BitPCM()
                            ▼
                     ┌──────────────────┐
                     │ Int16 PCM        │
                     │ (16-bit audio)   │
                     └─────┬────────────┘
                            │ arrayBufferToBase64()
                            ▼
                     ┌──────────────────┐
                     │ Base64 String    │
                     └─────┬────────────┘
                            │ WebSocket.send()
                            ▼
                     ┌──────────────────┐
                     │ Backend Server   │
                     └──────────────────┘
```

### 상세 구현

#### 1. 마이크 스트림 초기화

```tsx
// App.tsx: connectToBackend() 함수 내부

// 1. AudioContext 생성 (16kHz 샘플레이트)
const inputCtx = new AudioContext({ sampleRate: PCM_SAMPLE_RATE }); // 16000Hz

// 2. 마이크 접근 권한 요청 및 스트림 획득
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// 3. MediaStreamSource 생성
const source = inputCtx.createMediaStreamSource(stream);
sourceNodeRef.current = source;
```

**중요**: Gemini Live API는 **16kHz PCM 오디오**를 요구하므로 AudioContext를 16000Hz로 초기화합니다.

#### 2. 오디오 처리 체인 구성

```tsx
// Visualizer용 Analyser 노드
const inAnalyser = inputCtx.createAnalyser();
inAnalyser.fftSize = 256;
source.connect(inAnalyser);

// 오디오 처리용 ScriptProcessor 노드
const processor = inputCtx.createScriptProcessor(4096, 1, 1);
// 파라미터: bufferSize=4096, inputChannels=1, outputChannels=1

processor.onaudioprocess = (e) => {
  if (isMutedRef.current) return; // 음소거 시 스킵

  const inputData = e.inputBuffer.getChannelData(0); // Float32Array
  const packet = createPcmBlob(inputData);

  // WebSocket으로 전송
  wsServiceRef.current?.sendAudioData(packet.data, Date.now());
};

source.connect(processor);
processor.connect(inputCtx.destination); // 필수: 노드 활성화
```

**ScriptProcessorNode 선택 이유**:
- `AudioWorklet`은 더 현대적이지만 브라우저 지원이 제한적
- `ScriptProcessorNode`는 deprecated되었지만 광범위한 브라우저 지원
- 4096 버퍼 크기는 지연과 성능의 균형점

#### 3. 오디오 데이터 변환 (audioUtils.ts)

```tsx
// Float32 → Int16 PCM 변환
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2); // 2 bytes per sample
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    // 1. Float32 값 클램핑 (-1.0 ~ 1.0)
    let s = Math.max(-1, Math.min(1, float32Array[i]));

    // 2. Int16 범위로 스케일링
    s = s < 0 ? s * 0x8000 : s * 0x7fff; // -32768 ~ 32767

    // 3. Little-endian으로 저장
    view.setInt16(i * 2, s, true);
  }

  return buffer;
}

// ArrayBuffer → Base64 인코딩
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 최종 패킷 생성
export function createPcmBlob(data: Float32Array): PcmBlob {
  const pcmData = floatTo16BitPCM(data);
  const base64 = arrayBufferToBase64(pcmData);

  return {
    data: base64,
    mimeType: `audio/pcm;rate=${PCM_SAMPLE_RATE}`, // "audio/pcm;rate=16000"
  };
}
```

**변환 과정**:
1. **Float32Array** (Web Audio API 기본 포맷, -1.0 ~ 1.0)
2. **Int16 PCM** (Gemini API 요구사항, -32768 ~ 32767)
3. **Base64 String** (WebSocket 전송용 텍스트 인코딩)

#### 4. WebSocket 전송

```tsx
// WebSocketService.ts
sendAudioData(base64Data: string, timestamp: number) {
  this.send({
    type: 'audio',
    data: base64Data,
    timestamp
  });
}

send(data: Record<string, unknown>) {
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify(data));
  }
}
```

**전송 메시지 형식**:
```json
{
  "type": "audio",
  "data": "AAABAAACAAA...", // Base64 encoded PCM
  "timestamp": 1234567890123
}
```

**전송 주기**:
- 버퍼 크기: 4096 samples
- 샘플레이트: 16000 Hz
- 전송 주기: 4096 / 16000 = **256ms마다**

### 음성 출력 처리 Flow

```
┌──────────────────┐
│ Backend Server   │
└──────┬───────────┘
       │ WebSocket Message
       ▼
┌────────────────────────────────────┐
│ { type: 'audio_response',          │
│   data: "base64...",               │
│   sampleRate: 24000 }              │
└──────┬─────────────────────────────┘
       │ handleWebSocketMessage()
       ▼
┌──────────────────┐
│ Base64 String    │
└──────┬───────────┘
       │ base64ToArrayBuffer()
       ▼
┌──────────────────┐
│ ArrayBuffer      │
│ (PCM Int16)      │
└──────┬───────────┘
       │ decodeAudioData()
       ▼
┌──────────────────────────────────┐
│ AudioBuffer                      │
│ (Float32, 24kHz, 1 channel)      │
└──────┬───────────────────────────┘
       │ createBufferSource()
       ▼
┌──────────────────────────────────┐
│ AudioBufferSourceNode            │
└──────┬───────────────────────────┘
       │ connect()
       ▼
┌──────────────────┐
│ GainNode         │ ← Volume Control
│ (volume)         │
└──────┬───────────┘
       │
       ├────────────────────┐
       ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ AnalyserNode    │  │ Destination     │
│ (Visualization) │  │ (Speaker)       │
└─────────────────┘  └─────────────────┘
```

### 상세 구현

#### 1. 출력 AudioContext 초기화

```tsx
// App.tsx: connectToBackend()

// 24kHz AudioContext (Gemini 모델 출력 샘플레이트)
const outputCtx = new AudioContext({ sampleRate: 24000 });
outputAudioContextRef.current = outputCtx;

// GainNode로 볼륨 제어
const outGain = outputCtx.createGain();
outGain.gain.value = volume; // 0.0 ~ 1.5
outGain.connect(outputCtx.destination);
outputGainRef.current = outGain;

// Visualizer용 Analyser
const outAnalyser = outputCtx.createAnalyser();
outAnalyser.fftSize = 256;
outGain.connect(outAnalyser);
```

#### 2. WebSocket 메시지 수신 및 디코딩

```tsx
// App.tsx: handleWebSocketMessage()

case 'audio_response':
  if (message.data && outputAudioContextRef.current) {
    const ctx = outputAudioContextRef.current;

    // 1. Base64 → ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(message.data);

    // 2. PCM Int16 → AudioBuffer
    const audioBuffer = await decodeAudioData(arrayBuffer, ctx);

    // 3. 재생 스케줄링
    playAudioBuffer(audioBuffer);
  }
  break;
```

#### 3. PCM 수동 디코딩 (audioUtils.ts)

```tsx
export async function decodeAudioData(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext
): Promise<AudioBuffer> {
  // Gemini는 raw PCM 16-bit little-endian을 반환
  const dataInt16 = new Int16Array(arrayBuffer);
  const numChannels = 1; // Mono
  const frameCount = dataInt16.length / numChannels;

  // AudioBuffer 생성
  const audioBuffer = ctx.createBuffer(
    numChannels,
    frameCount,
    24000 // OUTPUT_SAMPLE_RATE
  );

  // Int16 → Float32 변환 및 복사
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Int16 (-32768 ~ 32767) → Float32 (-1.0 ~ 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  return audioBuffer;
}
```

**수동 디코딩 이유**:
- Gemini API는 **헤더 없는 raw PCM 데이터**를 반환
- `AudioContext.decodeAudioData()`는 **WAV/MP3 등 헤더 포함 포맷**만 지원
- 따라서 Int16 → Float32 변환을 수동으로 수행

#### 4. 오디오 재생 큐잉 시스템

```tsx
// App.tsx

// 재생 큐 관리
const nextStartTimeRef = useRef<number>(0);
const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = outputAudioContextRef.current!;

  // 1. 다음 재생 시작 시간 계산 (끊김 없는 연속 재생)
  nextStartTimeRef.current = Math.max(
    nextStartTimeRef.current,
    ctx.currentTime
  );

  // 2. BufferSource 생성 및 연결
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(outputGainRef.current!);

  // 3. 스케줄링된 시간에 재생 시작
  source.start(nextStartTimeRef.current);

  // 4. 다음 청크를 위한 시간 업데이트
  nextStartTimeRef.current += buffer.duration;

  // 5. 활성 소스 추적
  activeSourcesRef.current.add(source);
  source.onended = () => activeSourcesRef.current.delete(source);
};
```

**큐잉 시스템의 중요성**:
- WebSocket은 오디오를 **여러 청크로 분할 전송**
- 각 청크를 즉시 재생하면 **끊김 현상** 발생
- `nextStartTime`으로 청크를 **연속적으로 스케줄링**하여 자연스러운 재생

**예시**:
```
currentTime = 0.0s
Chunk 1 도착 → start(0.0), duration=0.5s → nextStartTime = 0.5s
Chunk 2 도착 → start(0.5), duration=0.3s → nextStartTime = 0.8s
Chunk 3 도착 → start(0.8), duration=0.4s → nextStartTime = 1.2s
```

### 음성 시각화 (Visualizer)

```tsx
// Visualizer.tsx

const render = () => {
  if (!isActive || !analyser) {
    // 비활성 시 평평한 선 표시
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = '#27272a';
    ctx.stroke();
    return;
  }

  // 1. 시간 도메인 데이터 추출 (파형)
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  // 2. Canvas에 파형 그리기
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.beginPath();

  const sliceWidth = width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0; // 0 ~ 2.0 범위
    const y = v * height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.stroke();

  // 3. 애니메이션 프레임 요청 (60fps)
  requestAnimationFrame(render);
};
```

**시각화 원리**:
- `AnalyserNode.getByteTimeDomainData()`: 현재 오디오 파형을 256개 샘플로 스냅샷
- 각 샘플을 Canvas의 Y좌표로 변환하여 연결
- 60fps로 지속적으로 렌더링하여 실시간 파형 애니메이션 구현

---

## 백엔드 통신 프로토콜

### WebSocket 연결 생명주기

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ 1. Connect
       ▼
┌──────────────────────────────────┐
│ new WebSocket(wsUrl)             │
└──────┬───────────────────────────┘
       │ 2. onopen event
       ▼
┌──────────────────────────────────┐
│ Send: { type: 'init', config }   │
│       config: {                  │
│         language: 'auto',        │
│         useWhisper: false,       │
│         sampleRate: 16000        │
│       }                          │
└──────┬───────────────────────────┘
       │ 3. Receive
       ▼
┌──────────────────────────────────┐
│ { type: 'connected',             │
│   sessionId: "uuid..." }         │
└──────┬───────────────────────────┘
       │ 4. Bidirectional Streaming
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────────┐
│ Send Audio  │ │ Receive  │ │ Receive      │
│ Chunks      │ │ Transcrip│ │ Audio        │
│ (256ms)     │ │ tion     │ │ Response     │
└─────────────┘ └──────────┘ └──────────────┘
       │              │              │
       │ 5. User Disconnects or Error
       ▼
┌──────────────────────────────────┐
│ Send: { type: 'close' }          │
└──────┬───────────────────────────┘
       │ 6. onclose event
       ▼
┌──────────────────────────────────┐
│ Cleanup & Reconnect Logic        │
└──────────────────────────────────┘
```

### WebSocket 메시지 프로토콜

#### 1. 클라이언트 → 서버 메시지

##### A. 초기화 메시지
```json
{
  "type": "init",
  "config": {
    "language": "auto",      // 자동 언어 감지
    "useWhisper": false,     // Gemini STT 사용 (Whisper 미사용)
    "sampleRate": 16000      // 16kHz PCM
  }
}
```

**목적**: WebSocket 연결 후 세션 초기화 및 설정 전달

##### B. 오디오 데이터 메시지
```json
{
  "type": "audio",
  "data": "AAABAAACAAAD...",  // Base64 encoded PCM Int16
  "timestamp": 1234567890123  // 클라이언트 타임스탬프
}
```

**목적**: 실시간 음성 스트리밍 (256ms마다 전송)

**전송 코드**:
```tsx
// WebSocketService.ts
sendAudioData(base64Data: string, timestamp: number) {
  this.send({ type: 'audio', data: base64Data, timestamp });
}
```

##### C. 중단 메시지
```json
{
  "type": "interrupt"
}
```

**목적**: AI 응답 중단 요청 (현재 미구현, 향후 확장 가능)

##### D. 종료 메시지
```json
{
  "type": "close"
}
```

**목적**: 정상 종료 시 서버에 알림

#### 2. 서버 → 클라이언트 메시지

##### A. 연결 확인 메시지
```json
{
  "type": "connected",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**처리**:
```tsx
case 'connected':
  setConnectionState(ConnectionState.CONNECTED);
  setError(null);
  break;
```

##### B. 입력 전사 메시지 (사용자 음성 → 텍스트)
```json
{
  "type": "input_transcription",
  "text": "안녕하세요",
  "isFinal": false,        // 스트리밍 중
  "language": "ko"
}
```

```json
{
  "type": "input_transcription",
  "text": "안녕하세요",
  "isFinal": true,         // 최종 확정
  "language": "ko"
}
```

**처리**:
```tsx
case 'input_transcription':
  if (message.isFinal) {
    commitMessage('user', message.text); // 메시지 목록에 추가
    setStreamingUserText('');            // 스트리밍 텍스트 초기화
  } else {
    setStreamingUserText(message.text);  // 실시간 표시
  }
  break;
```

##### C. 출력 전사 메시지 (AI 응답 텍스트)
```json
{
  "type": "output_transcription",
  "text": "Hello",
  "isFinal": false,
  "language": "en"
}
```

**처리**: 입력 전사와 동일한 패턴

##### D. 오디오 응답 메시지 (AI 응답 음성)
```json
{
  "type": "audio_response",
  "data": "AAABAAACAAAD...",  // Base64 encoded PCM Int16
  "sampleRate": 24000         // 24kHz (Gemini 출력 샘플레이트)
}
```

**처리**:
```tsx
case 'audio_response':
  if (message.data && outputAudioContextRef.current) {
    const ctx = outputAudioContextRef.current;
    nextStartTimeRef.current = Math.max(
      nextStartTimeRef.current,
      ctx.currentTime
    );

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
```

##### E. 턴 완료 메시지
```json
{
  "type": "turn_complete",
  "inputText": "안녕하세요",
  "outputText": "Hello"
}
```

**목적**: 한 번의 대화 턴이 완료되었음을 알림

**처리**:
```tsx
case 'turn_complete':
  setStreamingUserText('');
  setStreamingModelText('');
  // 첫 턴 완료 추적 (2번째 음성 로깅용)
  if (!firstTurnCompletedRef.current) {
    firstTurnCompletedRef.current = true;
    secondSpeechLoggedRef.current = false;
  }
  break;
```

##### F. 음성 상태 메시지
```json
{
  "type": "speech_state",
  "state": "speaking",      // "speaking" | "silent" | "processing"
  "timestamp": 1234567890123
}
```

**처리**:
```tsx
case 'speech_state':
  setSpeechState(message.state);
  break;
```

**상태 의미**:
- `speaking`: 사용자가 말할 수 있는 상태
- `silent`: 대기 중 또는 AI 응답 중
- `processing`: AI가 입력을 분석하는 중

##### G. 에러 메시지
```json
{
  "type": "error",
  "message": "Connection error",
  "code": "CONN_ERROR"
}
```

**처리**:
```tsx
case 'error':
  setError(message.message || 'WebSocket error');
  setConnectionState(ConnectionState.ERROR);
  break;
```

### WebSocket 재연결 로직

```tsx
// WebSocketService.ts

private scheduleReconnect() {
  if (!this.initConfig) return;

  // 최대 재연결 시도 횟수 체크
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    this.callbacks.onError(new Event('Maximum reconnect attempts reached'));
    return;
  }

  // 재연결 시도 횟수 증가
  this.reconnectAttempts += 1;

  // Exponential backoff: 2초 * 시도 횟수
  const delay = 2000 * this.reconnectAttempts;

  this.clearReconnectTimer();
  this.reconnectTimer = window.setTimeout(() => {
    if (!this.initConfig) return;
    this.connect(this.initConfig); // 재연결 시도
  }, delay);
}
```

**재연결 정책**:
- 1차 시도: 2초 후
- 2차 시도: 4초 후
- 3차 시도: 6초 후
- 4차 시도: 8초 후
- 5차 시도: 10초 후
- 5회 실패 시 재연결 포기

**재연결 플로우**:
```
WebSocket Close
      │
      ▼
  shouldReconnect? ────No───► End
      │
     Yes
      ▼
  attempts < 5? ────No───► Emit Error
      │
     Yes
      ▼
  delay = 2s * attempts
      │
      ▼
  setTimeout(connect, delay)
      │
      ▼
  Retry Connection
```

### 전체 통신 시퀀스 다이어그램

```
Frontend                WebSocket               Backend                Gemini API
   │                       │                       │                       │
   │─────Connect()────────>│                       │                       │
   │                       │────onopen────────────>│                       │
   │                       │<──────────────────────│                       │
   │<────onopen event──────│                       │                       │
   │                       │                       │                       │
   │──Send {type:init}────>│─────────────────────>│──────Connect()───────>│
   │                       │                       │<─────Session ID───────│
   │<─{type:connected}─────│<─────────────────────│                       │
   │                       │                       │                       │
   │──Send {audio:data}───>│─────────────────────>│──────Stream Audio────>│
   │──Send {audio:data}───>│─────────────────────>│──────Stream Audio────>│
   │                       │                       │<─────STT Result───────│
   │<─{input_transcription}│<─────────────────────│                       │
   │                       │                       │<─────Translation──────│
   │<─{output_transcription│<─────────────────────│                       │
   │                       │                       │<─────TTS Audio────────│
   │<─{audio_response}─────│<─────────────────────│                       │
   │<─{audio_response}─────│<─────────────────────│                       │
   │                       │                       │<─────Turn Complete────│
   │<─{turn_complete}──────│<─────────────────────│                       │
   │                       │                       │                       │
   │──Send {type:close}───>│─────────────────────>│──────Disconnect()────>│
   │                       │────onclose───────────>│                       │
   │<────onclose event─────│                       │                       │
```

---

## 주요 컴포넌트 상세 분석

### 1. App.tsx (메인 애플리케이션)

**역할**: 전체 애플리케이션의 오케스트레이터

#### 상태 관리 (React Hooks)

```tsx
// 연결 상태
const [connectionState, setConnectionState] = useState<ConnectionState>(
  ConnectionState.DISCONNECTED
);

// 메시지 목록 (확정된 대화 내용)
const [messages, setMessages] = useState<ChatMessage[]>([]);

// 스트리밍 중인 텍스트 (임시)
const [streamingUserText, setStreamingUserText] = useState<string>('');
const [streamingModelText, setStreamingModelText] = useState<string>('');

// UI 제어
const [error, setError] = useState<string | null>(null);
const [isMuted, setIsMuted] = useState(false);
const [volume, setVolume] = useState(1.0);
const [speechState, setSpeechState] = useState<SpeechState>('silent');
```

#### Refs (변경 가능한 참조)

```tsx
// Audio 처리
const inputAudioContextRef = useRef<AudioContext | null>(null);
const outputAudioContextRef = useRef<AudioContext | null>(null);
const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
const outputGainRef = useRef<GainNode | null>(null);

// Visualizer
const inputAnalyserRef = useRef<AnalyserNode | null>(null);
const outputAnalyserRef = useRef<AnalyserNode | null>(null);
const [inputAnalyserState, setInputAnalyserState] = useState<AnalyserNode | null>(null);
const [outputAnalyserState, setOutputAnalyserState] = useState<AnalyserNode | null>(null);

// 재생 큐
const nextStartTimeRef = useRef<number>(0);
const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

// WebSocket
const wsServiceRef = useRef<WebSocketService | null>(null);

// 상태 추적
const isMutedRef = useRef(isMuted);
const firstTurnCompletedRef = useRef(false);
const secondSpeechLoggedRef = useRef(false);
```

**Ref 사용 이유**:
- `useRef`는 컴포넌트 리렌더링 시에도 값을 유지
- 오디오 노드와 WebSocket은 React 상태로 관리 불필요 (UI에 직접 영향 없음)
- `isMutedRef`: `onaudioprocess` 콜백에서 최신 mute 상태 참조

#### 주요 함수

##### connectToBackend()
```tsx
const connectToBackend = async () => {
  try {
    setConnectionState(ConnectionState.CONNECTING);

    // 1. AudioContext 초기화
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    const outputCtx = new AudioContext({ sampleRate: 24000 });

    // 2. 출력 체인 구성 (Gain → Analyser → Destination)
    const outGain = outputCtx.createGain();
    outGain.gain.value = volume;
    outGain.connect(outputCtx.destination);
    outputGainRef.current = outGain;

    const outAnalyser = outputCtx.createAnalyser();
    outAnalyser.fftSize = 256;
    outGain.connect(outAnalyser);
    setOutputAnalyserState(outAnalyser);

    // 3. 마이크 스트림 획득
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 4. 입력 체인 구성 (Source → Analyser → Processor)
    const source = inputCtx.createMediaStreamSource(stream);
    const inAnalyser = inputCtx.createAnalyser();
    inAnalyser.fftSize = 256;
    source.connect(inAnalyser);
    setInputAnalyserState(inAnalyser);

    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (isMutedRef.current) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const packet = createPcmBlob(inputData);
      wsServiceRef.current?.sendAudioData(packet.data, Date.now());
    };
    source.connect(processor);
    processor.connect(inputCtx.destination);

    // 5. WebSocket 연결
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    const wsService = new WebSocketService(wsUrl, {
      onMessage: handleWebSocketMessage,
      onError: handleWebSocketError,
      onClose: handleWebSocketClose,
      onOpen: () => console.log('WebSocket connected')
    });
    wsServiceRef.current = wsService;
    wsService.connect({ language: 'auto', useWhisper: false, sampleRate: 16000 });

  } catch (e: any) {
    setError(e.message || "Failed to initialize");
    setConnectionState(ConnectionState.ERROR);
    stopAudio();
  }
};
```

##### handleWebSocketMessage()
```tsx
const handleWebSocketMessage = useCallback((message: ServerMessage) => {
  switch (message.type) {
    case 'connected':
      setConnectionState(ConnectionState.CONNECTED);
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
      // 오디오 재생 (위에서 설명한 playAudioBuffer 로직)
      break;

    case 'turn_complete':
      setStreamingUserText('');
      setStreamingModelText('');
      if (!firstTurnCompletedRef.current) {
        firstTurnCompletedRef.current = true;
      }
      break;

    case 'speech_state':
      setSpeechState(message.state);
      break;

    case 'error':
      setError(message.message || 'WebSocket error');
      setConnectionState(ConnectionState.ERROR);
      break;
  }
}, [commitMessage]);
```

##### cleanupConnection()
```tsx
const cleanupConnection = useCallback((state = ConnectionState.DISCONNECTED) => {
  // 1. 오디오 리소스 정리
  stopAudio();

  // 2. 상태 초기화
  setConnectionState(state);
  setStreamingUserText('');
  setStreamingModelText('');
  firstTurnCompletedRef.current = false;
  secondSpeechLoggedRef.current = false;
}, [stopAudio]);
```

##### stopAudio()
```tsx
const stopAudio = useCallback(() => {
  // 입력 스트림 정리
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

  // 출력 스트림 정리
  activeSourcesRef.current.forEach(source => source.stop());
  activeSourcesRef.current.clear();
  nextStartTimeRef.current = 0;

  if (outputAudioContextRef.current) {
    outputAudioContextRef.current.close();
    outputAudioContextRef.current = null;
  }

  // Visualizer 초기화
  setInputAnalyserState(null);
  setOutputAnalyserState(null);
}, []);
```

### 2. WebSocketService.ts (WebSocket 관리)

**역할**: WebSocket 연결 생명주기 및 메시지 관리

```tsx
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private initConfig: InitConfig | null = null;
  private shouldReconnect = true;

  constructor(
    private url: string,
    private callbacks: CallbackMap
  ) {}

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

    this.ws.onclose = () => {
      this.callbacks.onClose?.();
      if (this.shouldReconnect) {
        this.scheduleReconnect();
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

  disconnect(options?: { notifyServer?: boolean }) {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.ws) {
      if (options?.notifyServer) {
        this.send({ type: 'close' });
      }
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (!this.initConfig) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError(new Event('Maximum reconnect attempts reached'));
      return;
    }
    this.reconnectAttempts += 1;
    const delay = 2000 * this.reconnectAttempts;
    this.reconnectTimer = window.setTimeout(() => {
      this.connect(this.initConfig!);
    }, delay);
  }
}
```

### 3. Transcript.tsx (대화 내용 표시)

**역할**: 메시지 목록 및 스트리밍 텍스트 렌더링

```tsx
const Transcript: React.FC<TranscriptProps> = ({
  messages,
  userText,
  modelText
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userText, modelText]);

  // 빈 화면 표시
  if (messages.length === 0 && !userText && !modelText) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Bot className="w-12 h-12 mb-4" />
        <p>Ready to interpret.</p>
        <p>Speak Korean or English.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* 확정된 메시지 렌더링 */}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${
          msg.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          {msg.role === 'model' && <Bot icon />}
          <div className={`rounded-2xl px-4 py-3 ${
            msg.role === 'user'
              ? 'bg-zinc-800 text-zinc-100'
              : 'bg-blue-950/40 border border-blue-900/50 text-blue-100'
          }`}>
            {msg.text}
          </div>
          {msg.role === 'user' && <User icon />}
        </div>
      ))}

      {/* 스트리밍 사용자 입력 */}
      {userText.trim() && (
        <div className="flex gap-3 justify-end">
          <div className="opacity-80 bg-zinc-800/80">
            {userText}
            <span className="animate-pulse">|</span>
          </div>
          <User icon />
        </div>
      )}

      {/* 스트리밍 AI 응답 */}
      {modelText.trim() && (
        <div className="flex gap-3 justify-start">
          <Bot icon />
          <div className="opacity-80 bg-blue-950/30">
            {modelText}
            <span className="animate-pulse">|</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
```

### 4. Visualizer.tsx (오디오 시각화)

**역할**: 실시간 오디오 파형 렌더링

```tsx
const Visualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isActive,
  color = '#60a5fa'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!isActive || !analyser) {
        // 평평한 선
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // 파형 데이터 추출
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // 파형 그리기
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 rounded-lg bg-zinc-900/50"
    />
  );
};
```

### 5. SpeechStateIndicator.tsx (음성 상태 표시)

**역할**: 현재 음성 상태를 시각적으로 표시

```tsx
const SpeechStateIndicator: React.FC<{ state: SpeechState }> = ({ state }) => {
  const stateConfig = {
    speaking: {
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-400',
      icon: '🎤',
      text: '말씀하세요...',
      animation: 'animate-pulse-custom'
    },
    silent: {
      bgColor: 'bg-zinc-800/50',
      borderColor: 'border-zinc-700',
      textColor: 'text-zinc-400',
      icon: '👂',
      text: '듣고 있습니다...',
      animation: ''
    },
    processing: {
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-400',
      icon: '⏳',
      text: '처리 중...',
      animation: 'animate-spin-slow'
    }
  };

  const config = stateConfig[state];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                     ${config.bgColor} ${config.borderColor}`}>
      <div className={`text-2xl ${config.animation}`}>
        {config.icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
        <span className="text-xs text-zinc-500">
          {state}
        </span>
      </div>
    </div>
  );
};
```

---

## 데이터 흐름도

### 전체 데이터 흐름 (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                     User speaks Korean                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Audio Capture                                                 │
│    • Microphone → MediaStream                                    │
│    • Sample Rate: 16kHz                                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Audio Processing                                              │
│    • ScriptProcessorNode: 4096 samples buffer                    │
│    • Float32Array → Int16 PCM conversion                         │
│    • PCM → Base64 encoding                                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. WebSocket Transmission (Every 256ms)                          │
│    • Message: { type: 'audio', data: base64, timestamp }        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Backend Processing                                            │
│    • Base64 → PCM decoding                                       │
│    • Stream to Gemini Live API (gRPC)                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Gemini Live API Processing                                    │
│    • Speech-to-Text (Korean)                                     │
│    • Translation (Korean → English)                              │
│    • Text-to-Speech (English)                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend Response Streaming                                    │
│    • input_transcription: "안녕하세요" (isFinal: false/true)      │
│    • output_transcription: "Hello" (isFinal: false/true)         │
│    • audio_response: Base64 PCM chunks (24kHz)                   │
│    • speech_state: speaking/silent/processing                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend Message Handling                                     │
│    • input_transcription → streamingUserText or commitMessage    │
│    • output_transcription → streamingModelText or commitMessage  │
│    • audio_response → decodeAudioData → playback queue           │
│    • speech_state → SpeechStateIndicator update                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Audio Playback                                                │
│    • Base64 → ArrayBuffer → AudioBuffer (24kHz Float32)          │
│    • BufferSourceNode → GainNode → Destination                   │
│    • Scheduled playback (nextStartTime queue)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. UI Updates                                                    │
│    • Transcript: Display messages and streaming text             │
│    • Visualizer: Render input/output waveforms                   │
│    • SpeechStateIndicator: Update state badge                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   User hears English audio                       │
│                   User sees "Hello" transcription                │
└─────────────────────────────────────────────────────────────────┘
```

### 상태 전이도 (State Transitions)

```
┌─────────────────┐
│  DISCONNECTED   │ (Initial State)
└────────┬────────┘
         │ User clicks "Start Session"
         │ connectToBackend()
         ▼
┌─────────────────┐
│   CONNECTING    │ (Initializing Audio + WebSocket)
└────────┬────────┘
         │ onopen event + { type: 'connected' }
         ▼
┌─────────────────┐
│   CONNECTED     │ ◄────┐ (Active Session)
└────────┬────────┘      │
         │                │ Reconnect successful
         │                │
         ├────────────────┘
         │
         │ Error / User clicks "Stop" / Max reconnects
         ▼
┌─────────────────┐
│     ERROR       │ or DISCONNECTED
└─────────────────┘
```

### 메시지 처리 흐름 (Message Processing)

```
WebSocket Message Received
         │
         ▼
   Parse JSON
         │
         ▼
   Switch (message.type)
         │
         ├─────► 'connected' ──────► setConnectionState(CONNECTED)
         │
         ├─────► 'input_transcription'
         │                 │
         │                 ├─► isFinal? ──No──► setStreamingUserText(text)
         │                 │
         │                 └─► Yes ──► commitMessage('user', text)
         │                           └─► setStreamingUserText('')
         │
         ├─────► 'output_transcription'
         │                 │
         │                 ├─► isFinal? ──No──► setStreamingModelText(text)
         │                 │
         │                 └─► Yes ──► commitMessage('model', text)
         │                           └─► setStreamingModelText('')
         │
         ├─────► 'audio_response'
         │                 │
         │                 └─► base64ToArrayBuffer()
         │                           │
         │                           └─► decodeAudioData()
         │                                     │
         │                                     └─► playAudioBuffer()
         │
         ├─────► 'turn_complete' ──────► Clear streaming text
         │                                Set firstTurnCompleted flag
         │
         ├─────► 'speech_state' ────────► setSpeechState(state)
         │
         └─────► 'error' ───────────────► setError(message)
                                          setConnectionState(ERROR)
```

---

## 기술 스택

### Frontend

#### 핵심 프레임워크
- **React 19.2.1**: UI 컴포넌트 및 상태 관리
- **TypeScript 5.8.2**: 정적 타입 시스템

#### 빌드 도구
- **Vite 6.2.0**: 빠른 개발 서버 및 번들러
- **@vitejs/plugin-react**: React Fast Refresh 지원

#### UI 라이브러리
- **Tailwind CSS**: 유틸리티 기반 스타일링 (설정 파일 없음, JIT 모드)
- **lucide-react 0.559.0**: 아이콘 라이브러리 (Settings2, Mic, MicOff, Power, Bot, User, AlertCircle, Volume2)

#### Web APIs
- **Web Audio API**: 오디오 입출력 및 시각화
  - `AudioContext`: 오디오 처리 컨텍스트
  - `MediaStreamAudioSourceNode`: 마이크 입력
  - `ScriptProcessorNode`: 오디오 데이터 처리
  - `AnalyserNode`: 파형 데이터 추출
  - `GainNode`: 볼륨 제어
  - `AudioBufferSourceNode`: 오디오 재생
- **WebSocket API**: 실시간 양방향 통신
- **Canvas API**: 오디오 파형 시각화
- **MediaDevices API**: 마이크 접근 (`getUserMedia`)

### Backend (추정)

**참고**: 백엔드 코드는 제공되지 않았으므로 프로토콜 기반 추정

#### 서버 프레임워크
- **FastAPI** (Python): WebSocket 지원, 고성능 비동기 서버
- **uvicorn**: ASGI 서버

#### AI/ML 통합
- **Google Gemini Live API**:
  - 실시간 STT (Speech-to-Text)
  - 언어 번역 (KO ↔ EN)
  - 실시간 TTS (Text-to-Speech)
- **gRPC Streaming**: Gemini API와의 양방향 스트리밍 통신

#### 데이터 처리
- **Base64**: 오디오 데이터 인코딩/디코딩
- **PCM Audio Processing**: 16-bit PCM 처리

### 개발 도구
- **Node.js**: JavaScript 런타임
- **npm**: 패키지 매니저

### 환경 변수
```env
VITE_WS_URL=ws://localhost:8000/ws   # WebSocket 서버 URL
VITE_UI_PORT=3000                     # 개발 서버 포트
```

---

## 주요 기술적 결정 및 최적화

### 1. WebSocket vs HTTP Polling
**선택**: WebSocket
**이유**:
- 실시간 양방향 통신 필요
- 오디오 스트리밍은 지속적인 데이터 전송 요구
- HTTP 폴링 대비 낮은 지연시간 (< 50ms)
- 서버 부하 감소

### 2. ScriptProcessorNode vs AudioWorklet
**선택**: ScriptProcessorNode
**이유**:
- 광범위한 브라우저 지원 (Safari, older Chrome)
- AudioWorklet은 최신 브라우저만 지원
- Deprecated이지만 여전히 안정적으로 작동

**향후 개선**: AudioWorklet으로 마이그레이션 고려

### 3. 16kHz 샘플레이트 (입력)
**이유**:
- Gemini Live API 요구사항
- 음성 인식에 충분한 품질 (인간 음성 주파수: 300~3400 Hz)
- 낮은 대역폭 사용 (24kHz 대비 33% 절감)

### 4. 24kHz 샘플레이트 (출력)
**이유**:
- Gemini API TTS 출력 기본값
- 16kHz보다 자연스러운 음성 품질
- 48kHz 대비 대역폭 절약

### 5. Base64 인코딩
**이유**:
- WebSocket은 텍스트 또는 바이너리 프레임 지원
- JSON 메시지 내 오디오 포함을 위해 Base64 필요
- 대안: Binary WebSocket (구현 복잡도 증가)

### 6. 오디오 재생 큐잉 시스템
**이유**:
- WebSocket으로 오디오가 청크 단위로 도착
- 즉시 재생 시 끊김 현상 발생
- `nextStartTime` 스케줄링으로 매끄러운 연속 재생

### 7. React Refs for Audio Nodes
**이유**:
- Web Audio API 객체는 React 상태로 관리 불필요
- 리렌더링 시 오디오 노드 재생성 방지
- 성능 최적화 및 메모리 누수 방지

### 8. 스트리밍 텍스트 분리 (`streamingUserText` vs `streamingModelText`)
**이유**:
- 사용자와 AI 응답이 동시에 스트리밍될 수 있음
- 단일 상태 사용 시 텍스트 충돌 가능
- 독립적인 상태로 명확한 분리

### 9. Tailwind CSS
**이유**:
- 빠른 프로토타이핑
- 일관된 디자인 시스템
- 번들 크기 최적화 (JIT 모드)
- 커스텀 CSS 작성 최소화

### 10. TypeScript
**이유**:
- 타입 안전성으로 런타임 에러 감소
- IDE 자동완성 및 리팩토링 지원
- WebSocket 메시지 타입 정의로 프로토콜 명확화

---

## 성능 최적화 포인트

### 1. 오디오 버퍼 크기 (4096 samples)
- **지연**: 256ms (4096 / 16000)
- **균형**: 낮은 지연 vs CPU 사용률
- **대안**: 2048 (128ms, CPU 부하 증가) or 8192 (512ms, 지연 증가)

### 2. AnalyserNode FFT 크기 (256)
- **트레이드오프**: 주파수 해상도 vs 성능
- 256은 시각화에 충분하고 성능 영향 최소

### 3. Canvas 애니메이션 (requestAnimationFrame)
- 브라우저 최적화 (60fps 자동 조절)
- 탭이 백그라운드일 때 일시 중지

### 4. WebSocket 재연결 Exponential Backoff
- 서버 부하 방지
- 네트워크 불안정 시 점진적 재시도

### 5. React.memo 적용 가능 컴포넌트
- `Visualizer`: props 변경 시에만 리렌더링
- `Transcript`: messages 변경 시에만 리렌더링
- `SpeechStateIndicator`: state 변경 시에만 리렌더링

**현재 미적용**: 프로토타입 단계, 향후 최적화 여지

### 6. 메시지 가상화 (Virtual Scrolling)
**현재**: 모든 메시지 렌더링
**개선 가능**: 긴 대화 시 react-window 등 사용하여 뷰포트 내 메시지만 렌더링

---

## 알려진 제한사항 및 개선 방향

### 제한사항

1. **ScriptProcessorNode Deprecation**
   - 향후 브라우저에서 제거 가능
   - 해결: AudioWorklet으로 마이그레이션 필요

2. **브라우저 호환성**
   - Safari: WebSocket, Web Audio API 일부 제한
   - 모바일 브라우저: 백그라운드 오디오 재생 제한

3. **에러 복구**
   - 일부 에러 시나리오에서 사용자 수동 개입 필요
   - 해결: 더 세밀한 에러 핸들링 및 자동 복구

4. **오프라인 지원 없음**
   - 인터넷 연결 필수
   - 해결: Service Worker 및 오프라인 감지

5. **대용량 대화 기록**
   - 메모리 사용량 증가
   - 해결: 메시지 페이지네이션 또는 로컬 스토리지 저장

### 개선 방향

#### 단기 (1-2주)
- [ ] AudioWorklet 마이그레이션
- [ ] 에러 메시지 다국어화 (한/영)
- [ ] 로딩 스피너 및 상태 표시 개선
- [ ] 키보드 단축키 (Space: Mute Toggle, Esc: Disconnect)

#### 중기 (1-2개월)
- [ ] 대화 기록 저장 및 불러오기
- [ ] 사용자 설정 (볼륨, 샘플레이트, 언어)
- [ ] PWA 지원 (오프라인 감지, 설치 가능)
- [ ] 음성 활성화 감지 (VAD) - 무음 구간 필터링

#### 장기 (3개월+)
- [ ] 다중 언어 쌍 지원 (한-영 외)
- [ ] 대화 내보내기 (TXT, PDF)
- [ ] 실시간 자막 오버레이
- [ ] AI 응답 중단 기능 (interrupt 메시지 활용)
- [ ] 음성 감정 분석 및 표시

---

## 결론

Gemini Live Interpreter는 **실시간 양방향 음성 통역**을 위한 현대적인 웹 애플리케이션입니다. WebSocket 기반의 저지연 통신, Web Audio API를 활용한 정교한 오디오 처리, 그리고 직관적인 React UI를 통해 사용자에게 매끄러운 통역 경험을 제공합니다.

핵심 강점:
- ✅ **실시간성**: 256ms 주기의 오디오 스트리밍으로 자연스러운 대화 흐름
- ✅ **시각적 피드백**: 파형 시각화 및 상태 표시로 시스템 투명성 확보
- ✅ **확장 가능한 아키텍처**: 컴포넌트 기반 설계로 유지보수 및 기능 추가 용이
- ✅ **사용자 중심 UI**: 직관적인 인터페이스로 누구나 쉽게 사용 가능

이 문서는 시스템의 모든 측면을 종합적으로 분석하여, 개발자가 코드베이스를 이해하고 향후 개선 작업을 수행하는 데 필요한 기술적 기반을 제공합니다.
