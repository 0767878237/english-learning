// AuthService.ts
import type { User, PasswordValidationResult } from '../types';

const API_BASE = 'http://localhost:8000/api';

export class AuthService {
  /**
   * Validate password according to requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter (A-Z)
   * - At least 1 special character (!@#$%^&*)
   * - At least 1 number (0-9)
   */
  static validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength) {
      errors.push('Mật khẩu phải tối thiểu 8 ký tự');
    }
    if (!hasUppercase) {
      errors.push('Mật khẩu phải chứa ít nhất 1 chữ in hoa');
    }
    if (!hasSpecialChar) {
      errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)');
    }
    if (!hasNumber) {
      errors.push('Mật khẩu phải chứa ít nhất 1 số');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate username:
   * - Between 3-20 characters
   * - Alphanumeric and underscore only
   */
  static validateUsername(username: string): {
    isValid: boolean;
    error?: string;
  } {
    if (username.length < 3 || username.length > 20) {
      return {
        isValid: false,
        error: 'Tên người dùng phải từ 3-20 ký tự',
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        error: 'Tên người dùng chỉ chứa chữ, số và dấu gạch dưới',
      };
    }

    return { isValid: true };
  }

  /**
   * Login - call backend BFF API and save access token in state only
   */
  static async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Đăng nhập thất bại');
    }

    const data = await response.json();
    const user: User = {
      id: data.user.id.toString(),
      username: data.user.username,
      email: data.user.email,
      createdAt: new Date(),
    };

    return { token: data.access_token, user };
  }

  /**
   * Signup - create account and receive tokens from backend
   */
  static async signup(username: string, email: string, password: string): Promise<{ token: string; user: User; message?: string }> {
    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    const response = await fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.username) {
        throw new Error(`Tên người dùng: ${error.username[0]}`);
      }
      if (error.email) {
        throw new Error(`Email: ${error.email[0]}`);
      }
      throw new Error(error.detail || 'Đăng ký thất bại');
    }

    const data = await response.json();
    const user: User = {
      id: data.user.id.toString(),
      username: data.user.username,
      email: data.user.email,
      createdAt: new Date(),
    };

    return { token: data.access_token, user, message: data.message };
  }

  static async refreshAccessToken(): Promise<string> {
    const response = await fetch(`${API_BASE}/refresh/`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Không thể làm mới access token');
    }
    const data = await response.json();
    return data.access_token;
  }

  static async logout(): Promise<void> {
    await fetch(`${API_BASE}/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  static async fetchCurrentUser(accessToken?: string): Promise<User | null> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE}/me/`, {
      method: 'GET',
      headers: defaultHeaders,
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: data.id.toString(),
      username: data.username,
      email: data.email,
      createdAt: new Date(),
    };
  }

  static parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  static isTokenValid(token: string): boolean {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  // Legacy methods now no-op, front-end no longer stores cookies manually.
  static getStoredToken(): string | null {
    return null;
  }

  static storeToken(_: string): void {
    // no-op
  }

  static clearToken(): void {
    // no-op
  }
}

