import { describe, it, expect } from 'vitest';
import { ValidationRules, createFormField } from './form-validation';

describe('Form Validation Utilities', () => {
  describe('ValidationRules', () => {
    describe('required', () => {
      const rule = ValidationRules.required();

      it('should pass for non-empty values', () => {
        expect(rule('test')).toBeNull();
        expect(rule(123)).toBeNull();
        expect(rule(true)).toBeNull();
      });

      it('should fail for empty values', () => {
        expect(rule('')).toBe('This field is required');
        expect(rule(null)).toBe('This field is required');
        expect(rule(undefined)).toBe('This field is required');
        expect(rule('   ')).toBe('This field is required');
      });
    });

    describe('minLength', () => {
      const rule = ValidationRules.minLength(3);

      it('should pass for strings meeting minimum length', () => {
        expect(rule('abc')).toBeNull();
        expect(rule('abcd')).toBeNull();
      });

      it('should fail for strings below minimum length', () => {
        expect(rule('ab')).toBe('Must be at least 3 characters');
      });
    });

    describe('beanName', () => {
      const rule = ValidationRules.beanName();

      it('should pass for valid bean names', () => {
        expect(rule('Blue Bottle Hayes Valley')).toBeNull();
        expect(rule('Ethiopian Yirgacheffe')).toBeNull();
      });

      it('should fail for invalid bean names', () => {
        expect(rule('a')).toBe('Bean name must be at least 2 characters');
        expect(rule('a'.repeat(101))).toBe('Bean name must be no more than 100 characters');
        expect(rule(123 as any)).toBe('Bean name must be text');
      });
    });

    describe('roastLevel', () => {
      const rule = ValidationRules.roastLevel();

      it('should pass for valid roast levels', () => {
        expect(rule('Light')).toBeNull();
        expect(rule('Medium')).toBeNull();
        expect(rule('Dark')).toBeNull();
      });

      it('should fail for invalid roast levels', () => {
        expect(rule('Extra Dark')).toBe('Must select a valid roast level');
        expect(rule('light')).toBe('Must select a valid roast level');
      });
    });

    describe('rating', () => {
      const rule = ValidationRules.rating();

      it('should pass for valid ratings', () => {
        expect(rule(1)).toBeNull();
        expect(rule(3)).toBeNull();
        expect(rule(5)).toBeNull();
      });

      it('should fail for invalid ratings', () => {
        expect(rule(0)).toBe('Rating must be between 1 and 5 stars');
        expect(rule(6)).toBe('Rating must be between 1 and 5 stars');
        expect(rule(3.5)).toBe('Rating must be a whole number');
      });
    });
  });

  describe('createFormField', () => {
    it('should create field with initial value', () => {
      const field = createFormField('initial');
      
      let currentValue: any;
      field.subscribe(f => currentValue = f)();
      
      expect(currentValue.value).toBe('initial');
      expect(currentValue.valid).toBe(true);
      expect(currentValue.dirty).toBe(false);
      expect(currentValue.touched).toBe(false);
    });

    it('should validate on setValue', () => {
      const field = createFormField('', [ValidationRules.required()]);
      
      field.setValue('test');
      
      let currentValue: any;
      field.subscribe(f => currentValue = f)();
      
      expect(currentValue.value).toBe('test');
      expect(currentValue.valid).toBe(true);
      expect(currentValue.dirty).toBe(true);
    });

    it('should show validation errors', () => {
      const field = createFormField('initial', [ValidationRules.required()]);
      
      field.setValue('');
      
      let currentValue: any;
      field.subscribe(f => currentValue = f)();
      
      expect(currentValue.valid).toBe(false);
      expect(currentValue.errors).toHaveLength(1);
      expect(currentValue.errors[0].message).toBe('This field is required');
    });

    it('should reset to initial state', () => {
      const field = createFormField('initial', [ValidationRules.required()]);
      
      field.setValue('changed', true);
      field.reset();
      
      let currentValue: any;
      field.subscribe(f => currentValue = f)();
      
      expect(currentValue.value).toBe('initial');
      expect(currentValue.valid).toBe(true);
      expect(currentValue.dirty).toBe(false);
      expect(currentValue.touched).toBe(false);
    });
  });
});