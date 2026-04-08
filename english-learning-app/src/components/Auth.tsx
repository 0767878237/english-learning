// components/Auth.tsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import NotificationContainer from './Notification';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useNotification } from '../hooks/useNotification';
import './Auth.css';

type AuthMode = 'login' | 'signup';

const AuthContent: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="auth-container">
        <div className="auth-background" />
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="app-title">English Learning</h1>
            <div className="auth-tabs">
              <button
                className={`tab-button ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Đăng nhập
              </button>
              <button
                className={`tab-button ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >
                Đăng ký
              </button>
            </div>
          </div>

          <div className="auth-content">
            {mode === 'login' ? (
              <LoginForm onSwitchToSignup={() => setMode('signup')} />
            ) : (
              <SignupForm onSwitchToLogin={() => setMode('login')} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Auth: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthContent />
    </NotificationProvider>
  );
};

export default Auth;
