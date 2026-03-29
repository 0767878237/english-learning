// AuthService.ts
import type { User, PasswordValidationResult } from '../types';

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
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
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
   * Login - call backend API
   */
  static async login(username: string, password: string): Promise<{
    token: string;
    user: User;
  }> {
    const response = await fetch('http://localhost:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.non_field_errors?.[0] || 'Đăng nhập thất bại');
    }

    const data = await response.json();
    const user: User = {
      id: data.user_id.toString(),
      username,
      email: data.email,
      createdAt: new Date(), // Backend doesn't return this, can be updated later
    };

    return { token: data.token, user };
  }

  /**
   * Signup - call backend API
   */
  static async signup(username: string, email: string, password: string): Promise<{
    token: string;
    user: User;
    message?: string;
  }> {
    // Validate inputs locally first
    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    const response = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Handle specific errors
      if (error.username) {
        throw new Error(`Tên người dùng: ${error.username[0]}`);
      }
      if (error.email) {
        throw new Error(`Email: ${error.email[0]}`);
      }
      throw new Error('Đăng ký thất bại');
    }

    const data = await response.json();
    const user: User = {
      id: data.user.id.toString(),
      username: data.user.username,
      email: data.user.email,
      createdAt: new Date(),
    };

    // After registration, login to get token
    const loginResult = await this.login(username, password);

    return {
      token: loginResult.token,
      user: loginResult.user,
      message: data.message,
    };
  }

  /**
   * Check if token is valid
   */
  static isTokenValid(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token));
      return !!decoded.userId;
    } catch {
      return false;
    }
  }

  /**
   * Get stored token from localStorage
   */
  static getStoredToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Store token in localStorage
   */
  static storeToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token);
    } catch {
      console.error('Failed to store token');
    }
  }

  /**
   * Clear token from localStorage
   */
  static clearToken(): void {
    try {
      localStorage.removeItem('auth_token');
    } catch {
      console.error('Failed to clear token');
    }
  }
}
