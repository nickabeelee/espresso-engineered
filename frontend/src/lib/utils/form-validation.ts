/**
 * Form validation utilities for Bean Inventory Management
 * Provides real-time validation, error feedback, and form state management
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { ValidationError } from './error-handling';

export interface FormField<T = any> {
  value: T;
  errors: ValidationError[];
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

export interface FormState {
  valid: boolean;
  dirty: boolean;
  submitting: boolean;
  submitted: boolean;
  errors: ValidationError[];
}

export type ValidationRule<T = any> = (value: T) => string | null;

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => 
    (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      return null;
    },

  minLength: (min: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (typeof value === 'string' && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return null;
    },

  maxLength: (max: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (typeof value === 'string' && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return null;
    },

  pattern: (regex: RegExp, message: string): ValidationRule<string> =>
    (value) => {
      if (typeof value === 'string' && !regex.test(value)) {
        return message;
      }
      return null;
    },

  email: (message = 'Must be a valid email address'): ValidationRule<string> =>
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === 'string' && value && !emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  url: (message = 'Must be a valid URL'): ValidationRule<string> =>
    (value) => {
      if (typeof value === 'string' && value) {
        try {
          new URL(value);
          return null;
        } catch {
          return message;
        }
      }
      return null;
    },

  number: (message = 'Must be a valid number'): ValidationRule<any> =>
    (value) => {
      if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
        return message;
      }
      return null;
    },

  min: (min: number, message?: string): ValidationRule<number> =>
    (value) => {
      if (typeof value === 'number' && value < min) {
        return message || `Must be at least ${min}`;
      }
      return null;
    },

  max: (max: number, message?: string): ValidationRule<number> =>
    (value) => {
      if (typeof value === 'number' && value > max) {
        return message || `Must be no more than ${max}`;
      }
      return null;
    },

  oneOf: (options: any[], message?: string): ValidationRule<any> =>
    (value) => {
      if (!options.includes(value)) {
        return message || `Must be one of: ${options.join(', ')}`;
      }
      return null;
    },

  // Bean-specific validation rules
  beanName: (): ValidationRule<string> =>
    (value) => {
      if (typeof value !== 'string') return 'Bean name must be text';
      if (value.trim().length < 2) return 'Bean name must be at least 2 characters';
      if (value.trim().length > 100) return 'Bean name must be no more than 100 characters';
      return null;
    },

  roastLevel: (): ValidationRule<string> =>
    (value) => {
      const validLevels = ['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark'];
      if (!validLevels.includes(value)) {
        return 'Must select a valid roast level';
      }
      return null;
    },

  inventoryStatus: (): ValidationRule<string> =>
    (value) => {
      const validStatuses = ['unopened', 'plenty', 'getting_low', 'empty'];
      if (!validStatuses.includes(value)) {
        return 'Must select a valid inventory status';
      }
      return null;
    },

  rating: (): ValidationRule<number> =>
    (value) => {
      if (typeof value === 'number') {
        if (value < 1 || value > 5) {
          return 'Rating must be between 1 and 5 stars';
        }
        if (!Number.isInteger(value)) {
          return 'Rating must be a whole number';
        }
      }
      return null;
    },

  price: (): ValidationRule<number> =>
    (value) => {
      if (typeof value === 'number') {
        if (value < 0) return 'Price cannot be negative';
        if (value > 10000) return 'Price seems unreasonably high';
      }
      return null;
    },

  weight: (): ValidationRule<number> =>
    (value) => {
      if (typeof value === 'number') {
        if (value <= 0) return 'Weight must be greater than 0';
        if (value > 10000) return 'Weight seems unreasonably high';
      }
      return null;
    }
};

/**
 * Form field store with validation
 */
export function createFormField<T>(
  initialValue: T,
  rules: ValidationRule<T>[] = []
) {
  const { subscribe, set, update } = writable<FormField<T>>({
    value: initialValue,
    errors: [],
    touched: false,
    dirty: false,
    valid: true
  });

  function validate(value: T): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors.push({
          field: 'field',
          message: error
        });
      }
    }
    
    return errors;
  }

  function setValue(newValue: T, touch = false) {
    update(field => {
      const errors = validate(newValue);
      return {
        ...field,
        value: newValue,
        errors,
        valid: errors.length === 0,
        dirty: newValue !== initialValue,
        touched: touch || field.touched
      };
    });
  }

  function touch() {
    update(field => ({ ...field, touched: true }));
  }

  function reset() {
    set({
      value: initialValue,
      errors: [],
      touched: false,
      dirty: false,
      valid: true
    });
  }

  return {
    subscribe,
    setValue,
    touch,
    reset,
    validate: () => {
      let currentField: FormField<T>;
      subscribe(field => currentField = field)();
      const errors = validate(currentField!.value);
      update(field => ({
        ...field,
        errors,
        valid: errors.length === 0,
        touched: true
      }));
      return errors.length === 0;
    }
  };
}

/**
 * Form store with multiple fields
 */
export function createForm<T extends Record<string, any>>(
  fields: { [K in keyof T]: ReturnType<typeof createFormField> }
) {
  const formState = writable<FormState>({
    valid: true,
    dirty: false,
    submitting: false,
    submitted: false,
    errors: []
  });

  // Derived state from all fields
  const state = derived(
    [formState, ...Object.values(fields)],
    ([state, ...fieldStates]) => {
      const allValid = fieldStates.every(field => field.valid);
      const anyDirty = fieldStates.some(field => field.dirty);
      const allErrors = fieldStates.flatMap(field => field.errors);

      return {
        ...state,
        valid: allValid && state.errors.length === 0,
        dirty: anyDirty,
        errors: [...state.errors, ...allErrors]
      };
    }
  );

  function setSubmitting(submitting: boolean) {
    formState.update(state => ({ ...state, submitting }));
  }

  function setSubmitted(submitted: boolean) {
    formState.update(state => ({ ...state, submitted }));
  }

  function setErrors(errors: ValidationError[]) {
    formState.update(state => ({ ...state, errors }));
  }

  function clearErrors() {
    formState.update(state => ({ ...state, errors: [] }));
  }

  function validateAll(): boolean {
    const results = Object.values(fields).map(field => field.validate());
    return results.every(valid => valid);
  }

  function reset() {
    Object.values(fields).forEach(field => field.reset());
    formState.set({
      valid: true,
      dirty: false,
      submitting: false,
      submitted: false,
      errors: []
    });
  }

  function getValues(): T {
    const values = {} as T;
    Object.entries(fields).forEach(([key, field]) => {
      let currentValue: any;
      field.subscribe(f => currentValue = f.value)();
      values[key as keyof T] = currentValue;
    });
    return values;
  }

  return {
    subscribe: state.subscribe,
    fields,
    setSubmitting,
    setSubmitted,
    setErrors,
    clearErrors,
    validateAll,
    reset,
    getValues
  };
}

/**
 * Async validation helper
 */
export function createAsyncValidator<T>(
  validator: (value: T) => Promise<string | null>,
  debounceMs = 300
): ValidationRule<T> {
  let timeoutId: NodeJS.Timeout;
  let lastPromise: Promise<string | null>;

  return (value: T) => {
    return new Promise<string | null>((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const promise = validator(value);
          lastPromise = promise;
          const result = await promise;
          
          // Only resolve if this is still the latest promise
          if (promise === lastPromise) {
            resolve(result);
          }
        } catch (error) {
          if (lastPromise === validator(value)) {
            resolve('Validation failed');
          }
        }
      }, debounceMs);
    }) as any; // Type assertion needed for sync/async rule compatibility
  };
}

/**
 * Bean form validation schemas
 */
export const BeanFormValidation = {
  createBean: {
    name: [ValidationRules.required(), ValidationRules.beanName()],
    roaster_id: [ValidationRules.required('Please select a roaster')],
    roast_level: [ValidationRules.required('Please select a roast level'), ValidationRules.roastLevel()],
    country_of_origin: [ValidationRules.maxLength(100)],
    tasting_notes: [ValidationRules.maxLength(500)]
  },

  createBag: {
    bean_id: [ValidationRules.required('Please select a bean')],
    name: [ValidationRules.maxLength(100)],
    roast_date: [], // Optional date field
    weight_g: [ValidationRules.number(), ValidationRules.weight()],
    price: [ValidationRules.number(), ValidationRules.price()],
    purchase_location: [ValidationRules.maxLength(100)],
    inventory_status: [ValidationRules.inventoryStatus()]
  },

  createRoaster: {
    name: [ValidationRules.required(), ValidationRules.minLength(2), ValidationRules.maxLength(100)],
    website_url: [ValidationRules.url()]
  },

  rating: {
    rating: [ValidationRules.required('Please select a rating'), ValidationRules.rating()]
  }
};

/**
 * Form submission helper with error handling
 */
export async function submitForm<T>(
  form: ReturnType<typeof createForm>,
  submitFn: (values: T) => Promise<void>,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  if (!form.validateAll()) {
    return false;
  }

  form.setSubmitting(true);
  form.clearErrors();

  try {
    const values = form.getValues() as T;
    await submitFn(values);
    form.setSubmitted(true);
    onSuccess?.();
    return true;
  } catch (error) {
    const err = error as Error;
    
    // Try to parse validation errors from API response
    try {
      const errorData = JSON.parse(err.message);
      if (errorData.details && Array.isArray(errorData.details)) {
        const validationErrors = errorData.details.map((detail: any) => ({
          field: detail.path?.join('.') || 'general',
          message: detail.message || 'Invalid value'
        }));
        form.setErrors(validationErrors);
      } else {
        form.setErrors([{ field: 'general', message: err.message }]);
      }
    } catch {
      form.setErrors([{ field: 'general', message: err.message }]);
    }
    
    onError?.(err);
    return false;
  } finally {
    form.setSubmitting(false);
  }
}