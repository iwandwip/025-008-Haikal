# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/types` directory.

## Directory Overview

The `/types` directory contains TypeScript type definitions and declarations for the Smart Bisyaroh system. This ensures type safety and provides better development experience with IntelliSense and compile-time error checking.

## Type Definition Files

### Core Types
- **`svg.d.ts`** - SVG module declarations for React Native SVG integration

## Key Features

### SVG Type Declarations
Provides proper TypeScript support for SVG imports:

```typescript
// svg.d.ts - SVG module declaration
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
```

This allows for type-safe SVG imports:
```typescript
// Usage in components
import Icon from '../assets/icons/user.svg';

const Component = () => (
  <Icon width={24} height={24} fill="#000" />
);
```

## Type System Architecture

### Core Type Definitions
Common types used throughout the Smart Bisyaroh system:

```typescript
// User and Authentication Types
interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  nama: string;
  namaSantri?: string;
  namaWali?: string;
  noHP?: string;
  rfidSantri?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authInitialized: boolean;
  isAdmin: boolean;
}
```

### Payment System Types
```typescript
// Payment and Timeline Types
interface PaymentTimeline {
  id: string;
  namaTimeline: string;
  jenisTagihan: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  jumlahTagihan: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  hariLibur?: string[];
  aktif: boolean;
  createdAt: Date;
}

interface PaymentRecord {
  id: string;
  userId: string;
  timelineId: string;
  periodKey: string;
  amount: number;
  paid: boolean;
  paidAt?: Date;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: 'cash' | 'credit';
}

interface CreditBalance {
  userId: string;
  balance: number;
  lastUpdated: Date;
  transactions: CreditTransaction[];
}
```

### Hardware Integration Types
```typescript
// Mode-Based Hardware Types
type ESPMode = 'idle' | 'pairing' | 'payment' | 'solenoid';

interface RTDBSchema {
  mode: ESPMode;
  pairing_mode: string;
  payment_mode: {
    get: {
      rfid_code: string;
      amount_required: string;
    };
    set: {
      amount_detected: string;
      status: string;
    };
  };
  solenoid_command: 'locked' | 'unlock';
}

interface HardwareResponse {
  success: boolean;
  data?: any;
  error?: string;
  reason?: 'system_busy' | 'timeout' | 'hardware_error';
  currentMode?: ESPMode;
}
```

### Service Response Types
```typescript
// Standard Service Response Pattern
interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// Async Operation Result
interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  loading?: boolean;
}
```

## Component Prop Types

### Common Component Props
```typescript
// Base Component Props
interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Button Component Props
interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

// Input Component Props
interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
}
```

### Context Types
```typescript
// Auth Context Types
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authInitialized: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Notification Context Types
interface NotificationContextType {
  notifications: Notification[];
  showGeneralNotification: (title: string, message: string, type: NotificationType) => void;
  showPaymentSuccessNotification: (payment: PaymentRecord) => void;
  showErrorNotification: (title: string, message: string) => void;
  clearNotifications: () => void;
}

// Theme Context Types
interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  isAdmin: boolean;
  toggleTheme: () => void;
}
```

## Theme and Styling Types

### Color System Types
```typescript
// Theme Color Definitions
interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  white: string;
  black: string;
  
  // Gray Scale
  gray25: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  
  // Semantic Colors
  success: string;
  warning: string;
  error: string;
  border: string;
  
  // Shadow
  shadow: {
    color: string;
  };
}

// Style System Types
interface StyleSystem {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  typography: {
    title: TextStyle;
    subtitle: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    small: TextStyle;
  };
  
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}
```

## Utility Types

### Form and Validation Types
```typescript
// Form State Management
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Validation Rules
interface ValidationRule<T> {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule<T[K]>;
}
```

### API and Database Types
```typescript
// Firestore Document Types
interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Collection Reference Types
type UserCollection = CollectionReference<User>;
type PaymentCollection = CollectionReference<PaymentRecord>;
type TimelineCollection = CollectionReference<PaymentTimeline>;

// Query Types
interface QueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: {
    field: string;
    operator: WhereFilterOp;
    value: any;
  }[];
}
```

## Development Guidelines

### Adding New Types
1. **Descriptive naming** - Use clear, descriptive type names
2. **Consistency** - Follow established naming patterns
3. **Documentation** - Add JSDoc comments for complex types
4. **Modularity** - Group related types together
5. **Reusability** - Create reusable generic types

### Type Definition Patterns
```typescript
// Generic Service Response
interface ServiceResponse<TData = unknown, TError = string> {
  success: boolean;
  data?: TData;
  error?: TError;
  loading?: boolean;
}

// Async State Management
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched?: Date;
}

// Component State
interface ComponentState<T> extends AsyncState<T> {
  initialized: boolean;
  dirty: boolean;
}
```

### Export Patterns
```typescript
// Re-export types for easy importing
export type {
  User,
  PaymentRecord,
  PaymentTimeline,
  AuthState,
  ServiceResponse,
  ThemeColors,
  ButtonProps,
  InputProps
};

// Export type utilities
export type {
  AsyncResult,
  FormState,
  ValidationSchema,
  QueryOptions
};
```

## Integration with Libraries

### React Native Types
```typescript
// Extend React Native types
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

interface CustomViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  theme?: ThemeColors;
}

interface CustomTextProps {
  style?: StyleProp<TextStyle>;
  children: string | React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
}
```

### Firebase Types
```typescript
// Firebase integration types
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

interface FirebaseConverter<T> {
  toFirestore: (data: T) => DocumentData;
  fromFirestore: (snapshot: QueryDocumentSnapshot) => T;
}

// RTDB types
interface RTDBListener {
  ref: string;
  callback: (data: any) => void;
  unsubscribe: () => void;
}
```

## Testing Types

### Test Utilities
```typescript
// Test helper types
interface MockServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  delay?: number;
}

interface TestScenario {
  name: string;
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  verify: () => Promise<boolean>;
  cleanup: () => Promise<void>;
}

// Component test props
interface TestComponentProps {
  testID: string;
  mockData?: any;
  onTestEvent?: (event: string, data?: any) => void;
}
```

## Best Practices

### Type Safety
- **Strict types** - Avoid `any` types when possible
- **Union types** - Use union types for known variations
- **Generics** - Use generics for reusable types
- **Optional properties** - Mark optional properties correctly
- **Readonly** - Use readonly for immutable data

### Performance Considerations
- **Type complexity** - Keep types simple and focused
- **Circular references** - Avoid circular type dependencies
- **Bundle impact** - Types don't affect runtime bundle size
- **Compilation time** - Complex types can slow compilation

### Documentation
```typescript
/**
 * Represents a payment timeline for TPQ bisyaroh collection
 * @interface PaymentTimeline
 */
interface PaymentTimeline {
  /** Unique identifier for the timeline */
  id: string;
  
  /** Human-readable name for the timeline */
  namaTimeline: string;
  
  /** Type of billing period */
  jenisTagihan: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  
  /** Amount to be collected per period (in IDR) */
  jumlahTagihan: number;
  
  /** ISO date string for timeline start */
  tanggalMulai: string;
  
  /** ISO date string for timeline end */
  tanggalSelesai: string;
  
  /** Optional array of holiday names to exclude */
  hariLibur?: string[];
  
  /** Whether this timeline is currently active */
  aktif: boolean;
  
  /** Timestamp when timeline was created */
  createdAt: Date;
}
```