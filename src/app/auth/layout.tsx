import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Training Compiler account.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
              Training Compiler
            </span>
          </div>

          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px' }}>
            Enterprise Learning<br />Management System
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '360px' }}>
            A unified platform for courses, assessments, coding challenges,
            and professional development tracking.
          </p>

          {/* Feature list */}
          <ul style={{ marginTop: '48px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Course & module management',
              'MCQ and coding assessments',
              'Real-time progress analytics',
              'Auto-generated certificates',
            ].map((feature) => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="auth-form-panel">
        {children}
      </div>

      <style>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
        }
        .auth-brand {
          flex: 1;
          background: var(--color-primary);
          background-image: radial-gradient(ellipse at 30% 50%, rgba(18, 58, 122, 0.6) 0%, transparent 70%);
          display: flex;
          align-items: center;
          padding: 48px;
        }
        .auth-brand-inner {
          max-width: 440px;
        }
        .auth-form-panel {
          width: 480px;
          flex-shrink: 0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
          overflow-y: auto;
        }
        @media (max-width: 900px) {
          .auth-brand { display: none; }
          .auth-form-panel { width: 100%; padding: 32px 24px; }
        }
      `}</style>
    </div>
  );
}
