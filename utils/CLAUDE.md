# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/utils` directory.

## Directory Overview

The `/utils` directory contains utility functions and helper modules for the Smart Bisyaroh system. These functions provide common functionality that can be reused across the application, including date formatting, validation, and payment status management.

## Utility Files

### Core Utilities
- **`dateUtils.js`** - Date formatting and validation utilities with Indonesian locale support
- **`validation.js`** - Form validation functions for user input
- **`paymentStatusUtils.js`** - Payment status calculation and formatting utilities

## Key Features

### Date Utilities (`dateUtils.js`)
Comprehensive date handling with Indonesian locale support:

```javascript
// Safe date formatting with error handling
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return "-";
  
  try {
    let date;
    
    // Handle different input types
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return "-";
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Indonesian locale formatting
    const defaultOptions = {
      day: "numeric",
      month: "short", 
      year: "numeric",
      ...options
    };
    
    return date.toLocaleDateString("id-ID", defaultOptions);
  } catch (error) {
    return "-";
  }
};
```

### Specialized Date Formatting
```javascript
// Long format with full month name
export const formatDateLong = (dateInput) => {
  return formatDate(dateInput, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

// Date with time information
export const formatDateTime = (dateInput) => {
  return formatDate(dateInput, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Safe ISO string conversion
export const toISOString = (dateInput = new Date()) => {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
};
```

## Validation Utilities (`validation.js`)

### Form Validation Functions
Simple, reusable validation functions:

```javascript
// Email validation with regex
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Required field validation
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Password confirmation matching
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};
```

### Usage in Forms
```javascript
// Form validation example
const validateForm = (formData) => {
  const errors = {};
  
  if (!validateEmail(formData.email)) {
    errors.email = "Format email tidak valid";
  }
  
  if (!validatePassword(formData.password)) {
    errors.password = "Password minimal 6 karakter";
  }
  
  if (!validateRequired(formData.name)) {
    errors.name = "Nama wajib diisi";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## Payment Status Utilities (`paymentStatusUtils.js`)

### Dynamic Payment Status Updates
```javascript
// Update payment status based on current date
export const updatePaymentStatusBasedOnDate = (payment, currentDate = new Date()) => {
  if (payment.status === 'lunas') {
    return payment;
  }

  const deadlineDate = new Date(payment.deadline || currentDate);
  const isOverdue = currentDate > deadlineDate;

  if (isOverdue && payment.status === 'belum_bayar') {
    return {
      ...payment,
      status: 'terlambat'
    };
  }

  return payment;
};
```

### Payment Analytics
```javascript
// Calculate payment completion progress
export const calculatePaymentProgress = (payments) => {
  const total = payments.length;
  if (total === 0) return 0;

  const completed = payments.filter(p => p.status === 'lunas').length;
  return Math.round((completed / total) * 100);
};

// Get next payment due
export const getNextPaymentDue = (payments) => {
  const unpaidPayments = payments.filter(p => 
    p.status === 'belum_bayar' || p.status === 'terlambat'
  );
  
  if (unpaidPayments.length === 0) return null;
  
  return unpaidPayments.sort((a, b) => {
    const periodA = parseInt(a.periodKey.replace('period_', ''));
    const periodB = parseInt(b.periodKey.replace('period_', ''));
    return periodA - periodB;
  })[0];
};
```

### Payment Status Prioritization
```javascript
// Define status priority for sorting
export const getPaymentStatusPriority = (status) => {
  const priorities = {
    'terlambat': 1,    // Highest priority - overdue
    'belum_bayar': 2,  // Medium priority - unpaid
    'lunas': 3         // Lowest priority - paid
  };
  return priorities[status] || 4;
};

// Sort payments by status priority
export const sortPaymentsByStatus = (payments) => {
  return [...payments].sort((a, b) => {
    const priorityA = getPaymentStatusPriority(a.status);
    const priorityB = getPaymentStatusPriority(b.status);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Secondary sort by period number
    const periodA = parseInt(a.periodKey.replace('period_', ''));
    const periodB = parseInt(b.periodKey.replace('period_', ''));
    return periodA - periodB;
  });
};
```

## UI Helper Functions

### Visual Status Indicators
```javascript
// Get status-appropriate colors
export const getPaymentStatusColor = (status, colors) => {
  switch (status) {
    case 'lunas':
      return colors.success;   // Green for paid
    case 'belum_bayar':
      return colors.error;     // Red for unpaid
    case 'terlambat':
      return colors.warning;   // Orange for overdue
    default:
      return colors.gray500;   // Gray for unknown
  }
};

// Get status emoji icons
export const getPaymentStatusIcon = (status) => {
  switch (status) {
    case 'lunas':
      return '✅';
    case 'belum_bayar':
      return '❌';
    case 'terlambat':
      return '⚠️';
    default:
      return '❓';
  }
};
```

### Currency and Date Formatting
```javascript
// Format Indonesian Rupiah currency
export const formatPaymentAmount = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format payment dates in Indonesian locale
export const formatPaymentDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
```

## Development Guidelines

### Creating New Utilities
1. **Pure functions** - Utilities should be pure functions without side effects
2. **Error handling** - Handle edge cases and invalid inputs gracefully
3. **Documentation** - Add comprehensive JSDoc comments
4. **Testing** - Write unit tests for utility functions
5. **Performance** - Optimize for frequently called functions

### Utility Function Pattern
```javascript
/**
 * Utility function template with error handling
 * @param {*} input - Input parameter
 * @param {Object} options - Configuration options
 * @returns {*} Processed result or fallback value
 */
export const utilityFunction = (input, options = {}) => {
  // 1. Input validation
  if (!input) {
    return options.fallback || null;
  }
  
  try {
    // 2. Main processing logic
    const result = processInput(input, options);
    
    // 3. Validation of result
    if (isValidResult(result)) {
      return result;
    }
    
    return options.fallback || null;
  } catch (error) {
    // 4. Error handling
    console.warn('Utility function error:', error);
    return options.fallback || null;
  }
};
```

### Error Handling Standards
```javascript
// Consistent error handling pattern
export const safeOperation = (input) => {
  if (!input) {
    console.warn('Missing required input');
    return defaultValue;
  }
  
  try {
    return performOperation(input);
  } catch (error) {
    console.warn('Operation failed:', error.message);
    return defaultValue;
  }
};
```

## Common Utility Patterns

### Array Utilities
```javascript
// Safe array operations
export const safeFilter = (array, predicate) => {
  if (!Array.isArray(array)) return [];
  return array.filter(predicate);
};

export const safeMap = (array, mapper) => {
  if (!Array.isArray(array)) return [];
  return array.map(mapper);
};

export const safeFlatMap = (array, mapper) => {
  if (!Array.isArray(array)) return [];
  return array.flatMap(mapper);
};
```

### String Utilities
```javascript
// String manipulation helpers
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (str, maxLength = 100) => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};
```

### Object Utilities
```javascript
// Safe object operations
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result?.[key] === undefined) return defaultValue;
    result = result[key];
  }
  
  return result;
};

export const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  const result = {};
  keys.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  });
  return result;
};
```

## Performance Optimization

### Memoization
```javascript
// Simple memoization utility
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

// Usage example
export const expensiveCalculation = memoize((a, b) => {
  // Expensive operation
  return a * b * Math.random();
});
```

### Debouncing
```javascript
// Debounce utility for performance
export const debounce = (func, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Usage in search
export const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 500);
```

## Testing Utilities

### Test Helpers
```javascript
// Testing utility functions
export const createMockDate = (dateString) => {
  return new Date(dateString);
};

export const createMockPayment = (overrides = {}) => {
  return {
    id: 'mock-payment-id',
    amount: 5000,
    status: 'belum_bayar',
    deadline: new Date().toISOString(),
    periodKey: 'period_1',
    ...overrides
  };
};

export const createMockUser = (overrides = {}) => {
  return {
    uid: 'mock-user-id',
    email: 'test@example.com',
    nama: 'Test User',
    role: 'user',
    ...overrides
  };
};
```

## Indonesian Localization

### Locale-Specific Utilities
```javascript
// Indonesian-specific formatting
export const formatIndonesianCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatIndonesianDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

// Status translation helpers
export const translatePaymentStatus = (status) => {
  const translations = {
    'paid': 'lunas',
    'unpaid': 'belum_bayar',
    'overdue': 'terlambat'
  };
  return translations[status] || status;
};
```