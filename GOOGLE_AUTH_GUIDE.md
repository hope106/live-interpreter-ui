# Google OAuth 2.0 인증 구현 가이드 - Frontend

**Gemini Live Interpreter - 사용자 인증 (UI)**

이 문서는 React 프론트엔드에서 Google OAuth 2.0 인증을 구현하는 가이드입니다.

---

## 📋 목차

- [시스템 개요](#시스템-개요)
- [구현 단계](#구현-단계)
- [패키지 설치](#패키지-설치)
- [구현 상세](#구현-상세)
- [환경 변수 설정](#환경-변수-설정)
- [사용 방법](#사용-방법)

---

## 🎯 시스템 개요

### 인증 플로우
```
1. 사용자가 "Google 로그인" 버튼 클릭
2. 백엔드 /auth/google/login으로 리다이렉트
3. Google OAuth 2.0 로그인 페이지로 이동
4. 사용자 로그인 및 권한 동의
5. 백엔드 /auth/google/callback으로 리다이렉트
6. 백엔드에서 JWT 토큰 발급
7. 프론트엔드 /auth/callback?token=xxx로 리다이렉트
8. JWT 토큰을 로컬 스토리지에 저장
9. 메인 페이지로 이동
10. WebSocket 연결 시 토큰을 쿼리 파라미터로 전달
```

### 주요 기능
- Google 로그인 버튼
- JWT 토큰 저장 및 관리 (로컬 스토리지)
- 토큰 검증
- WebSocket 인증
- 자동 로그인 (토큰 복원)
- 로그아웃

---

## 📦 구현 단계

### Phase 1: 패키지 설치
1. react-router-dom 설치

### Phase 2: 타입 정의
1. AuthState 인터페이스 추가

### Phase 3: 인증 Context 구현
1. AuthContext 생성
2. AuthProvider 구현
3. useAuth Hook

### Phase 4: 페이지 구현
1. Login 페이지
2. AuthCallback 페이지
3. ProtectedRoute 컴포넌트

### Phase 5: 기존 코드 수정
1. App.tsx 수정 (WebSocket 토큰 전달)
2. index.tsx 수정 (라우팅 설정)

---

## 📥 패키지 설치

```bash
npm install react-router-dom
```

**package.json** 의존성 확인:
```json
{
  "dependencies": {
    "lucide-react": "^0.559.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "react-router-dom": "^7.1.3"
  }
}
```

---

## 💻 구현 상세

### 1. 타입 정의

**types.ts** (기존 파일에 추가)
```typescript
// 기존 타입들...

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    email: string;
    name: string;
  } | null;
}
```

---

### 2. 인증 Context

**contexts/AuthContext.tsx** (신규 파일)
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '../types';

interface AuthContextType {
  auth: AuthState;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });

  // 로컬 스토리지에서 토큰 복원 (자동 로그인)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyAndSetToken(token);
    }
  }, []);

  const verifyAndSetToken = async (token: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/verify?token=${token}`);

      if (response.ok) {
        const data = await response.json();
        setAuth({
          isAuthenticated: true,
          token,
          user: {
            email: data.email,
            name: data.name,
          },
        });
        localStorage.setItem('auth_token', token);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    // 백엔드 로그인 엔드포인트로 리다이렉트
    window.location.href = `${backendUrl}/auth/google/login`;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      user: null,
    });
    localStorage.removeItem('auth_token');
  };

  const setToken = async (token: string) => {
    await verifyAndSetToken(token);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### 3. 로그인 페이지

**pages/Login.tsx** (신규 파일)
```typescript
import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <LogIn className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Gemini Live Interpreter</h1>
            <p className="text-zinc-400 text-sm">실시간 양방향 음성 통역 시스템</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="text-center text-xs text-zinc-500">
              <p>허가된 사용자만 접근할 수 있습니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

### 4. 콜백 페이지

**pages/AuthCallback.tsx** (신규 파일)
```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // 토큰 저장 후 메인 페이지로 이동
      setToken(token).then(() => {
        navigate('/');
      });
    } else {
      // 토큰이 없으면 로그인 페이지로
      navigate('/login');
    }
  }, [navigate, setToken]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">인증 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
```

---

### 5. App.tsx 수정

**App.tsx** (수정 필요 부분)

기존 imports에 추가:
```typescript
import { LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
```

함수 컴포넌트 시작 부분에 추가:
```typescript
function App() {
  const { auth, logout } = useAuth();

  // ... 기존 state 선언들 ...
```

`connectToBackend` 함수 수정:
```typescript
const connectToBackend = async () => {
  try {
    setConnectionState(ConnectionState.CONNECTING);
    setError(null);

    // ... 기존 오디오 컨텍스트 설정 ...

    // WebSocket URL에 토큰 추가
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    const wsUrlWithToken = `${wsUrl}?token=${auth.token}`;

    const wsService = new WebSocketService(wsUrlWithToken, {
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
```

헤더에 사용자 정보 표시 추가:
```typescript
<header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
  <div className="flex items-center gap-3">
    {/* 기존 로고 및 타이틀 */}
  </div>

  <div className="flex items-center gap-4">
    {/* 사용자 정보 */}
    {auth.user && (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-300">{auth.user.name}</p>
          <p className="text-xs text-zinc-500">{auth.user.email}</p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
    )}

    {/* 기존 연결 상태 표시 */}
  </div>
</header>
```

---

### 6. index.tsx 수정

**index.tsx** (전체 수정)
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import LoginPage from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  return auth.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { auth, login } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        auth.isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={login} />
      } />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## ⚙️ 환경 변수 설정

**.env** (프로젝트 루트)
```bash
VITE_WS_URL=ws://localhost:8000/ws
VITE_BACKEND_URL=http://localhost:8000
```

프로덕션:
```bash
VITE_WS_URL=wss://yourdomain.com/ws
VITE_BACKEND_URL=https://yourdomain.com
```

---

## 🚀 사용 방법

### 1. 개발 환경 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. 로그인 플로우

1. 브라우저에서 `http://localhost:5173` 접속
2. 자동으로 `/login` 페이지로 리다이렉트
3. "Sign in with Google" 버튼 클릭
4. Google 계정으로 로그인
5. 백엔드에서 화이트리스트 확인
6. 인증 성공 시 메인 페이지로 이동
7. WebSocket 연결 및 통역 서비스 사용

### 3. 자동 로그인

- 로컬 스토리지에 토큰이 저장되어 있으면 자동 로그인
- 페이지 새로고침 시에도 로그인 상태 유지
- 토큰 만료 시 자동으로 로그아웃 및 로그인 페이지로 이동

### 4. 로그아웃

- 헤더의 로그아웃 버튼 클릭
- 로컬 스토리지에서 토큰 삭제
- 로그인 페이지로 리다이렉트

---

## 📁 파일 구조

```
live-interpreter-ui/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # 인증 Context (신규)
│   ├── pages/
│   │   ├── Login.tsx                # 로그인 페이지 (신규)
│   │   └── AuthCallback.tsx         # OAuth 콜백 페이지 (신규)
│   ├── App.tsx                      # 메인 앱 (수정)
│   ├── index.tsx                    # 엔트리 포인트 (수정)
│   └── types.ts                     # 타입 정의 (수정)
├── .env                             # 환경 변수
└── package.json                     # 의존성
```

---

## 🔧 트러블슈팅

### Q1. 로그인 후 토큰이 저장되지 않음
**A**: 브라우저 개발자 도구 > Application > Local Storage에서 `auth_token` 확인

### Q2. WebSocket 연결 시 인증 실패
**A**: 콘솔에서 WebSocket URL 확인 (`ws://localhost:8000/ws?token=xxx`)

### Q3. 자동 로그인이 작동하지 않음
**A**:
- 로컬 스토리지에 토큰이 있는지 확인
- `/auth/verify` 엔드포인트가 정상 작동하는지 확인
- 토큰이 만료되었는지 확인

### Q4. 로그인 후 계속 로딩 중
**A**:
- 백엔드 `/auth/google/callback`에서 올바른 프론트엔드 URL로 리다이렉트하는지 확인
- 환경 변수 `FRONTEND_URL` 설정 확인

---

## 🔐 보안 고려사항

### 1. 토큰 저장
- 로컬 스토리지 사용 (XSS 취약점 주의)
- HttpOnly 쿠키 사용 고려 (더 안전)

### 2. HTTPS 사용
- 프로덕션에서는 반드시 HTTPS 사용
- 토큰이 평문으로 전송되지 않도록 주의

### 3. 토큰 만료
- 백엔드에서 설정한 만료 시간 확인
- 토큰 갱신(Refresh Token) 기능 고려

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0
