<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Live Interpreter

실시간 양방향 음성 통역 애플리케이션 | Real-time Bidirectional Voice Interpreter

[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📖 Overview | 개요

**Gemini Live Interpreter**는 Google의 Gemini Live API를 활용한 실시간 음성 통역 웹 애플리케이션입니다. 한국어와 영어 간의 즉각적인 양방향 통역을 제공하며, 음성 입력을 자동으로 감지하여 상대 언어로 변환한 후 음성과 텍스트로 출력합니다.

A real-time voice interpreter web application powered by Google's Gemini Live API. Provides instant bidirectional translation between Korean and English, automatically detecting speech input and converting it to the target language with both audio and text output.

### ✨ Key Features | 주요 기능

- 🎤 **실시간 음성 입력** | Real-time Voice Input
  - 마이크를 통한 연속 음성 스트리밍
  - Continuous voice streaming via microphone

- 🔊 **실시간 음성 출력** | Real-time Voice Output
  - AI 통역 결과의 즉각적인 음성 재생
  - Immediate audio playback of AI translation

- 📝 **실시간 텍스트 전사** | Real-time Text Transcription
  - 사용자 입력과 AI 응답의 텍스트 변환 및 표시
  - Text conversion and display of user input and AI responses

- 📊 **오디오 시각화** | Audio Visualization
  - 입력/출력 오디오의 실시간 파형 표시
  - Real-time waveform display of input/output audio

- 🔄 **양방향 스트리밍** | Bidirectional Streaming
  - WebSocket 기반 full-duplex 통신
  - Full-duplex communication via WebSocket

- 🎯 **음성 상태 추적** | Speech State Tracking
  - 말하기/듣기/처리 중 상태 실시간 표시
  - Real-time display of speaking/listening/processing states

## 🏗️ Architecture | 아키텍처

```
┌─────────────────┐     WebSocket      ┌─────────────────┐     gRPC      ┌──────────────┐
│   Frontend UI   │ ◄───────────────►  │  Backend Server │ ◄──────────►  │  Gemini API  │
│   (React)       │  JSON + Base64     │   (FastAPI)     │  Streaming    │   (Google)   │
└─────────────────┘     Audio          └─────────────────┘               └──────────────┘
```

**상세 아키텍처는 [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md)를 참조하세요.**
**For detailed architecture, see [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md).**

## 🚀 Quick Start | 빠른 시작

### Prerequisites | 사전 요구사항

- **Node.js** (v18 이상 권장)
- **Backend Server** ([gemini-live-interpreter backend](../backend))
- **Gemini API Key**

### Installation | 설치

1. **Clone the repository | 저장소 복제**
   ```bash
   git clone <repository-url>
   cd live-interpreter-ui
   ```

2. **Install dependencies | 의존성 설치**
   ```bash
   npm install
   ```

3. **Set up environment variables | 환경 변수 설정**

   Create `.env.local` file:
   ```env
   VITE_WS_URL=ws://localhost:8000/ws
   VITE_UI_PORT=3000
   ```

4. **Start the backend server | 백엔드 서버 시작**

   Navigate to the backend directory and start the server:
   ```bash
   cd ../backend
   export GEMINI_API_KEY=your_api_key_here
   # Follow backend README for detailed setup
   ```

5. **Run the app | 앱 실행**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🎮 Usage | 사용 방법

### Starting a Session | 세션 시작

1. 브라우저에서 애플리케이션 열기 (Open the application in your browser)
2. "Start Session" 버튼 클릭 (Click the "Start Session" button)
3. 마이크 권한 허용 (Allow microphone access)
4. 한국어 또는 영어로 말하기 시작 (Start speaking in Korean or English)

### Controls | 제어

- **Start/Stop Session**: WebSocket 연결 및 오디오 스트림 시작/종료
- **Mute/Unmute Mic**: 마이크 음소거 토글
- **Volume Slider**: AI 응답 음성 볼륨 조절 (0% ~ 150%)

### Visual Indicators | 시각적 표시

- **Connection Status**: CONNECTED (초록색), CONNECTING (노란색), DISCONNECTED (회색)
- **Speech State**:
  - 🎤 **Speaking** (말씀하세요...): 사용자가 말할 수 있는 상태
  - 👂 **Silent** (듣고 있습니다...): AI 응답 중 또는 대기 중
  - ⏳ **Processing** (처리 중...): AI가 입력을 분석하는 중

## 📁 Project Structure | 프로젝트 구조

```
live-interpreter-ui/
├── App.tsx                      # Main application component
├── index.tsx                    # Entry point
├── types.ts                     # TypeScript type definitions
├── components/
│   ├── Transcript.tsx           # Chat transcript display
│   ├── Visualizer.tsx           # Audio waveform visualization
│   └── SpeechStateIndicator.tsx # Speech state display
├── services/
│   └── WebSocketService.ts      # WebSocket connection management
├── utils/
│   └── audioUtils.ts            # Audio processing utilities
└── TECHNICAL_ANALYSIS.md        # Comprehensive technical documentation
```

## 🛠️ Technology Stack | 기술 스택

### Frontend
- **React 19.2.1**: UI 컴포넌트 및 상태 관리
- **TypeScript 5.8.2**: 정적 타입 시스템
- **Vite 6.2.0**: 빌드 도구 및 개발 서버
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **lucide-react**: 아이콘 라이브러리

### Web APIs
- **Web Audio API**: 오디오 입출력 및 시각화
- **WebSocket API**: 실시간 양방향 통신
- **Canvas API**: 오디오 파형 렌더링
- **MediaDevices API**: 마이크 접근

### Backend Integration
- **WebSocket Protocol**: JSON 메시지 + Base64 인코딩 오디오
- **Audio Format**: PCM Int16, 16kHz (input), 24kHz (output)

## 📊 Communication Protocol | 통신 프로토콜

### Client → Server Messages

```json
// Initialize session
{
  "type": "init",
  "config": {
    "language": "auto",
    "useWhisper": false,
    "sampleRate": 16000
  }
}

// Audio data (every 256ms)
{
  "type": "audio",
  "data": "base64_encoded_pcm",
  "timestamp": 1234567890123
}
```

### Server → Client Messages

```json
// Input transcription (user speech)
{
  "type": "input_transcription",
  "text": "안녕하세요",
  "isFinal": true,
  "language": "ko"
}

// Output transcription (AI response)
{
  "type": "output_transcription",
  "text": "Hello",
  "isFinal": true,
  "language": "en"
}

// Audio response (AI voice)
{
  "type": "audio_response",
  "data": "base64_encoded_pcm",
  "sampleRate": 24000
}

// Speech state update
{
  "type": "speech_state",
  "state": "speaking",
  "timestamp": 1234567890123
}
```

**전체 프로토콜 명세는 [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md#백엔드-통신-프로토콜)를 참조하세요.**

## 🔧 Configuration | 설정

### Environment Variables | 환경 변수

| Variable        | Description                    | Default                  |
|-----------------|--------------------------------|--------------------------|
| `VITE_WS_URL`   | WebSocket server URL           | `ws://localhost:8000/ws` |
| `VITE_UI_PORT`  | Development server port        | `3000`                   |

### Audio Settings | 오디오 설정

- **Input Sample Rate**: 16kHz (Gemini API requirement)
- **Output Sample Rate**: 24kHz (Gemini API output)
- **Buffer Size**: 4096 samples (~256ms latency)
- **Audio Format**: PCM Int16 (16-bit signed integer)

## 📚 Documentation | 문서

- **[TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md)**:
  - 전체 시스템 아키텍처
  - UI 구성 및 화면 구조 상세 분석
  - 음성 전달 메커니즘 (입력/출력 흐름)
  - 백엔드 통신 프로토콜 명세
  - 주요 컴포넌트 상세 분석
  - 데이터 흐름도 및 상태 전이도

## 🐛 Known Limitations | 알려진 제한사항

1. **ScriptProcessorNode Deprecation**: 향후 AudioWorklet으로 마이그레이션 필요
2. **Browser Compatibility**: Safari 및 모바일 브라우저에서 일부 제한
3. **Offline Support**: 인터넷 연결 필수
4. **Long Conversations**: 대화 기록이 길어질 경우 메모리 사용량 증가

## 🗺️ Roadmap | 로드맵

### Short-term (1-2 weeks)
- [ ] AudioWorklet migration
- [ ] Error message localization (KO/EN)
- [ ] Keyboard shortcuts (Space: Mute, Esc: Disconnect)

### Mid-term (1-2 months)
- [ ] Conversation history save/load
- [ ] User settings (volume, language preferences)
- [ ] PWA support (offline detection, installable)
- [ ] Voice Activity Detection (VAD)

### Long-term (3+ months)
- [ ] Multi-language pair support
- [ ] Conversation export (TXT, PDF)
- [ ] Real-time subtitle overlay
- [ ] AI response interruption

## 📄 License | 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support | 지원

For issues and questions:
- 🐛 [GitHub Issues](../../issues)

---

<div align="center">

**Built with ❤️ using React, TypeScript, and Gemini Live API**

</div>
