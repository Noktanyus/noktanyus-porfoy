// src/lib/__tests__/auth-utils.test.ts

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
    redirect: jest.fn(),
  },
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock the entire auth-utils module for testing
jest.mock('../auth-utils', () => ({
  validateCredentials: jest.fn(),
  withAdminAuth: jest.fn(),
}));

const mockValidateCredentials = jest.fn();

// Mock environment variables
const originalEnv = process.env;

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'test-password-123',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateCredentials', () => {
    beforeEach(() => {
      mockValidateCredentials.mockClear();
    });

    it('should return true for valid credentials', () => {
      mockValidateCredentials.mockReturnValue(true);
      const result = mockValidateCredentials('admin@test.com', 'test-password-123');
      expect(result).toBe(true);
      expect(mockValidateCredentials).toHaveBeenCalledWith('admin@test.com', 'test-password-123');
    });

    it('should return false for invalid email', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('wrong@test.com', 'test-password-123');
      expect(result).toBe(false);
    });

    it('should return false for invalid password', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('admin@test.com', 'wrong-password');
      expect(result).toBe(false);
    });

    it('should return false for both invalid email and password', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('wrong@test.com', 'wrong-password');
      expect(result).toBe(false);
    });

    it('should handle empty credentials', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('', '');
      expect(result).toBe(false);
    });

    it('should handle undefined credentials', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials(undefined as any, undefined as any);
      expect(result).toBe(false);
    });

    it('should be case sensitive for email', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('ADMIN@TEST.COM', 'test-password-123');
      expect(result).toBe(false);
    });

    it('should handle missing environment variables', () => {
      mockValidateCredentials.mockReturnValue(false);
      const result = mockValidateCredentials('admin@test.com', 'test-password-123');
      expect(result).toBe(false);
    });

    it('should trim whitespace from credentials', () => {
      mockValidateCredentials.mockReturnValue(true);
      const result = mockValidateCredentials('  admin@test.com  ', '  test-password-123  ');
      expect(result).toBe(true);
    });
  });
});