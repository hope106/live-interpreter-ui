import React from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

/**
 * Why the layout looked "broken"
 * - The screenshot behavior (huge Google logo, full-width rows, no rounded card) strongly suggests
 *   Tailwind classes were NOT being applied at runtime (CSS not loaded / Tailwind not built).
 * - This component therefore includes inline style fallbacks so it renders correctly even without Tailwind.
 */
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      color: '#1a1b1f',
    },
    card: {
      width: '100%',
      maxWidth: 400,
      background: '#fff',
      borderRadius: 32,
      boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
      padding: 24,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    },
    header: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12, marginBottom: 28 },
    title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 22, textAlign: 'center' },
    sub: { fontSize: 15, color: '#6b7280', margin: 0, textAlign: 'center' },
    logoWrap: { width: 72, height: 72, position: 'relative', marginBottom: 18 },
    logoBorder: {
      position: 'absolute',
      inset: 0,
      borderRadius: 20,
      background: 'linear-gradient(45deg, #3b82f6, #ec4899, #f59e0b)',
      padding: 3,
    },
    logoInner: {
      width: '100%',
      height: '100%',
      borderRadius: 17,
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    btn: {
      width: '100%',
      height: 56,
      borderRadius: 20,
      border: '1px solid #e5e7eb',
      background: '#fff',
      color: '#111827',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      paddingLeft: 20,
      paddingRight: 20,
      cursor: 'pointer',
    },
    btnLeftIcon: { width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' },
    btnText: { flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 600 },
    footer: {
      marginTop: 28,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      opacity: 0.85,
    },
    footerText: { fontSize: 12, color: '#6b7280' },
    privyMark: { display: 'flex', alignItems: 'center', gap: 6 },
    privyDot: {
      width: 12,
      height: 12,
      borderRadius: 999,
      background: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    privyDash: { width: 6, height: 2, borderRadius: 999, background: '#fff', marginTop: 2 },
    privyText: { fontSize: 14, fontWeight: 800, letterSpacing: -0.2, color: '#111827' },
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-[#1a1b1f]"
      style={styles.page}
    >
      <div className="max-w-[400px] w-full bg-white rounded-[32px] shadow-xl p-6 relative flex flex-col" style={styles.card}>

        <div className="flex flex-col items-center mt-4 mb-8" style={styles.header}>
          <h1 className="text-xl font-bold text-gray-900 mb-8 text-center tracking-tight" style={styles.title}>
            Welcome to Gemini Interpreter
          </h1>

          <div className="w-[72px] h-[72px] relative mb-6" style={styles.logoWrap}>
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-blue-500 via-pink-500 to-yellow-500 p-[3px]" style={styles.logoBorder}>
              <div className="w-full h-full bg-white rounded-[17px] flex items-center justify-center" style={styles.logoInner} />
            </div>
          </div>

          <p className="text-gray-500 text-[15px] font-normal text-center" style={styles.sub}>
            Live Interpreter [ Korean ⇄ English ]
          </p>
        </div>

        <div className="space-y-3 w-full" style={styles.list}>
          <button
            type="button"
            onClick={onLogin}
            className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] text-gray-800 font-medium h-[56px] px-5 rounded-[20px] flex items-center gap-4 transition-all group"
            style={styles.btn}
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center" style={styles.btnLeftIcon}>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <span className="flex-1 text-left text-[15px]" style={styles.btnText}>
              Google
            </span>
          </button>

        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-1.5 opacity-80" style={styles.footer}>
          <span className="text-gray-500 text-xs" style={styles.footerText}>
            Protected by
          </span>
          <div className="flex items-center gap-1" style={styles.privyMark}>
            <div className="w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center" style={styles.privyDot}>
              <div className="w-1.5 h-0.5 bg-white rounded-full mt-0.5" style={styles.privyDash} />
            </div>
            <span className="text-gray-900 font-bold text-sm tracking-tight" style={styles.privyText}>
              HOPE106
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
