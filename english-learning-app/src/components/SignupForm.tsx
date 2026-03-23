// components/SignupForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/AuthService';
import type { PasswordValidationResult } from '../types';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string[];
    confirmPassword?: string;
    submit?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
  });
  const { signup } = useAuth();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setErrors(prev => ({ ...prev, username: undefined, submit: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    const validation = AuthService.validatePassword(pwd);
    setPasswordValidation(validation);
    setErrors(prev => ({
      ...prev,
      password: validation.errors.length > 0 ? validation.errors : undefined,
      submit: undefined,
    }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setConfirmPassword(pwd);
    if (pwd && pwd !== password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Mật khẩu xác nhận không khớp',
        submit: undefined,
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        confirmPassword: undefined,
        submit: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate username
    if (!username.trim()) {
      setErrors(prev => ({
        ...prev,
        username: 'Vui lòng nhập tên người dùng',
      }));
      return;
    }

    const usernameValidation = AuthService.validateUsername(username);
    if (!usernameValidation.isValid) {
      setErrors(prev => ({
        ...prev,
        username: usernameValidation.error,
      }));
      return;
    }

    // Validate password
    if (!password) {
      setErrors(prev => ({
        ...prev,
        password: ['Vui lòng nhập mật khẩu'],
      }));
      return;
    }

    if (!passwordValidation.isValid) {
      setErrors(prev => ({
        ...prev,
        password: passwordValidation.errors,
      }));
      return;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Vui lòng xác nhận mật khẩu',
      }));
      return;
    }

    if (confirmPassword !== password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Mật khẩu xác nhận không khớp',
      }));
      return;
    }

    setIsLoading(true);
    try {
      await signup(username, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setErrors(prev => ({
        ...prev,
        submit: message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    username.trim().length > 0 &&
    passwordValidation.isValid &&
    confirmPassword &&
    confirmPassword === password;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="signup-username" className="form-label">
          Tên người dùng
        </label>
        <input
          id="signup-username"
          type="text"
          className={`form-input ${errors.username ? 'input-error' : ''}`}
          placeholder="Nhập tên người dùng (3-20 ký tự)"
          value={username}
          onChange={handleUsernameChange}
          disabled={isLoading}
          autoComplete="username"
        />
        {errors.username && <p className="error-message">{errors.username}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-password" className="form-label">
          Mật khẩu
        </label>
        <input
          id="signup-password"
          type="password"
          className={`form-input ${errors.password ? 'input-error' : ''}`}
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          autoComplete="new-password"
        />

        {password && (
          <div className="password-requirements">
            <p className="requirements-title">Yêu cầu mật khẩu:</p>
            <ul>
              <li className={passwordValidation.errors.length === 0 ? 'met' : 'unmet'}>
                <span className={passwordValidation.errors.every(e => !e.includes('8 ký tự')) ? 'check' : 'x'}>
                  ✓
                </span>
                Tối thiểu 8 ký tự
              </li>
              <li className={passwordValidation.errors.some(e => e.includes('in hoa')) ? 'unmet' : 'met'}>
                <span className={passwordValidation.errors.some(e => e.includes('in hoa')) ? 'x' : 'check'}>
                  ✓
                </span>
                1 chữ in hoa (A-Z)
              </li>
              <li className={passwordValidation.errors.some(e => e.includes('đặc biệt')) ? 'unmet' : 'met'}>
                <span className={passwordValidation.errors.some(e => e.includes('đặc biệt')) ? 'x' : 'check'}>
                  ✓
                </span>
                1 ký tự đặc biệt (!@#$%^&*)
              </li>
              <li className={passwordValidation.errors.some(e => e.includes('số')) ? 'unmet' : 'met'}>
                <span className={passwordValidation.errors.some(e => e.includes('số')) ? 'x' : 'check'}>
                  ✓
                </span>
                1 số (0-9)
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="signup-confirm" className="form-label">
          Xác nhận mật khẩu
        </label>
        <input
          id="signup-confirm"
          type="password"
          className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        {!errors.confirmPassword && confirmPassword && (
          <p className="success-message">✓ Mật khẩu khớp</p>
        )}
      </div>

      {errors.submit && <p className="error-message form-error">{errors.submit}</p>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>

      <div className="auth-toggle">
        <p>
          Đã có tài khoản?{' '}
          <button
            type="button"
            className="toggle-link"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
