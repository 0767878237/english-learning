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
   * Simulate login - in real implementation, call backend API
   */
  static async login(username: string, password: string): Promise<{
    token: string;
    user: User;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation
    if (username === 'demo' && password === 'Demo@123') {
      const user: User = {
        id: '1',
        username: 'demo',
        createdAt: new Date(),
      };

      const token = btoa(JSON.stringify({ userId: user.id, username: user.username }));

      return { token, user };
    }

    throw new Error('Tên người dùng hoặc mật khẩu không chính xác');
  }

  /**
   * Simulate signup - in real implementation, call backend API
   */
  static async signup(username: string, password: string): Promise<{
    token: string;
    user: User;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate inputs
    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('; '));
    }

    // Check if username exists (mock)
    const existingUsers = ['admin', 'user', 'test'];
    if (existingUsers.includes(username.toLowerCase())) {
      throw new Error('Tên người dùng đã tồn tại');
    }

    // Create user
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      createdAt: new Date(),
    };

    const token = btoa(JSON.stringify({ userId: user.id, username: user.username }));

    return { token, user };
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
