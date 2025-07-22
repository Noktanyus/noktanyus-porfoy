// src/lib/__tests__/utils.test.ts

import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'valid-class');
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle object-style conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'primary': true
      });
      expect(result).toContain('active');
      expect(result).toContain('primary');
      expect(result).not.toContain('disabled');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      // tailwind-merge should handle conflicting classes
      const result = cn('p-4', 'p-2');
      // Should keep the last one (p-2) and remove conflicting p-4
      expect(result).toContain('p-2');
      expect(result).not.toContain('p-4');
    });
  });
});