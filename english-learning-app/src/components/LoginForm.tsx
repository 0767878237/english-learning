// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameError('');
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError('');

    // Validate inputs
    if (!username.trim()) {
      setUsernameError('Vui lòng nhập tên người dùng');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      addNotification('success', '✓ Đăng nhập thành công!', 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      addNotification('error', `✕ ${message}`, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await login('demo', 'Demo@123');
      addNotification('success', '✓ Demo đăng nhập thành công!', 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo login failed';
      addNotification('error', `✕ ${message}`, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim().length > 0 && password.length > 0;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Tên người dùng
        </label>
        <input
          id="username"
          type="text"
          className={`form-input ${usernameError ? 'input-error' : ''}`}
          placeholder="Nhập tên người dùng"
          value={username}
          onChange={handleUsernameChange}
          disabled={isLoading}
          autoComplete="username"
        />
        {usernameError && <p className="error-message">{usernameError}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          className={`form-input ${error ? 'input-error' : ''}`}
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {error && <p className="error-message">{error}</p>}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleDemoLogin}
        disabled={isLoading}
      >
        Demo (demo / Demo@123)
      </button>

      <div className="auth-toggle">
        <p>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            className="toggle-link"
            onClick={onSwitchToSignup}
            disabled={isLoading}
          >
            Đăng ký
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
