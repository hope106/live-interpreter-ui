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
