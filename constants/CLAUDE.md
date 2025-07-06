# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/constants` directory.

## Directory Overview

The `/constants` directory contains application-wide constants and configuration values for the Smart Bisyaroh system. This includes theme definitions, color schemes, and other immutable values used throughout the application.

## Constants Files

### Core Constants
- **`Colors.js`** - Comprehensive theme and color system with role-based themes

## Key Features

### Revolutionary Role-Based Theme System
The color system implements a sophisticated dual-theme architecture:

```javascript
// Admin theme - Blue color scheme
const adminTheme = {
  primary: '#2563eb',      // Blue 600
  primaryLight: '#3b82f6', // Blue 500
  primaryDark: '#1d4ed8',  // Blue 700
  secondary: '#60a5fa',    // Blue 400
  accent: '#dbeafe',       // Blue 100
};

// Wali theme - Green color scheme
const waliTheme = {
  primary: '#059669',      // Green 600
  primaryLight: '#10b981', // Green 500
  primaryDark: '#047857',  // Green 700
  secondary: '#34d399',    // Green 400
  accent: '#d1fae5',       // Green 100
};
```

### Intelligent Theme Selection
```javascript
// Automatic theme selection based on user role
export const getThemeByRole = (isAdmin, isDark = false) => {
  if (isDark) {
    return darkTheme;
  }
  if (isAdmin) {
    return adminTheme; // Blue theme for administrators
  }
  return waliTheme; // Green theme for parents (Wali)
};
```

## Color System Architecture

### Base Color Palette
```javascript
// Comprehensive gray scale
const grayScale = {
  gray25: '#fcfcfd',   // Lightest
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',  // Middle gray
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',  // Darkest
};
```

### Semantic Colors
```javascript
// Status and feedback colors
const semanticColors = {
  success: '#10b981',  // Green for success states
  warning: '#f59e0b',  // Amber for warnings
  error: '#ef4444',    // Red for errors
  border: '#e5e7eb',   // Border color
};
```

### Theme Variants
```javascript
// Light theme (default)
export const lightTheme = {
  primary: '#F50057',
  secondary: '#00f59e',
  background: '#ffffff',
  // ... complete theme object
};

// Dark theme support
export const darkTheme = {
  primary: '#F50057',
  secondary: '#00f59e',
  background: '#111827',  // Dark background
  white: '#1f2937',       // Inverted whites
  black: '#ffffff',       // Inverted blacks
  // ... inverted gray scale
};
```

## Usage Patterns

### Component Theme Integration
```javascript
import { getThemeByRole } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const Component = () => {
  const { isAdmin } = useAuth();
  const colors = getThemeByRole(isAdmin);
  
  return (
    <View style={{
      backgroundColor: colors.background,
      borderColor: colors.border
    }}>
      <Text style={{ color: colors.primary }}>
        Themed Content
      </Text>
    </View>
  );
};
```

### Legacy Theme Support
```javascript
// Backward compatibility
export const getColors = (theme) => {
  if (!theme || typeof theme !== 'string') {
    return lightTheme;
  }
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Default export for legacy components
export const Colors = lightTheme;
```

### Role-Based Styling
```javascript
// Admin interface styling
const adminStyles = {
  primaryButton: {
    backgroundColor: adminTheme.primary, // Blue
    borderColor: adminTheme.primaryDark,
  },
  accent: {
    backgroundColor: adminTheme.accent, // Light blue
  }
};

// Wali interface styling
const waliStyles = {
  primaryButton: {
    backgroundColor: waliTheme.primary, // Green
    borderColor: waliTheme.primaryDark,
  },
  accent: {
    backgroundColor: waliTheme.accent, // Light green
  }
};
```

## Design System Integration

### Color Hierarchy
```javascript
// Primary colors - Main brand colors for each role
// Secondary colors - Supporting colors for accents
// Gray scale - Neutral colors for text and backgrounds
// Semantic colors - Status and feedback colors

const colorHierarchy = {
  brand: {
    admin: adminTheme.primary,    // #2563eb
    wali: waliTheme.primary,      // #059669
  },
  text: {
    primary: colors.gray900,      // Dark text
    secondary: colors.gray600,    // Medium text
    tertiary: colors.gray400,     // Light text
  },
  background: {
    primary: colors.white,        // Main background
    secondary: colors.gray50,     // Card backgrounds
    tertiary: colors.gray25,      // Subtle backgrounds
  }
};
```

### Component Color Mapping
```javascript
// Button color variants
const buttonColors = {
  primary: {
    admin: adminTheme.primary,
    wali: waliTheme.primary,
  },
  secondary: {
    admin: adminTheme.secondary,
    wali: waliTheme.secondary,
  },
  outline: {
    admin: adminTheme.primaryLight,
    wali: waliTheme.primaryLight,
  }
};
```

## Development Guidelines

### Adding New Colors
1. **Follow naming conventions** - Use semantic names (primary, secondary, success, etc.)
2. **Maintain consistency** - Ensure colors work across both themes
3. **Consider accessibility** - Check contrast ratios
4. **Update all themes** - Add to admin, wali, light, and dark themes
5. **Document usage** - Specify when to use each color

### Color Selection Principles
```javascript
// Color selection criteria
const colorCriteria = {
  contrast: 'WCAG AA compliant (4.5:1 minimum)',
  brand: 'Blue for admin, green for wali',
  semantic: 'Green=success, red=error, amber=warning',
  neutral: 'Gray scale for text and backgrounds',
  accessibility: 'Support for high contrast modes'
};
```

### Theme Extension Pattern
```javascript
// Extending themes for new features
const extendTheme = (baseTheme, extensions) => ({
  ...baseTheme,
  ...extensions,
  // Ensure core colors remain intact
  primary: baseTheme.primary,
  secondary: baseTheme.secondary,
});

// Example: Payment status colors
const paymentColors = {
  paid: colors.success,
  pending: colors.warning,
  overdue: colors.error,
  partial: colors.gray500,
};
```

## Accessibility Considerations

### Color Contrast
```javascript
// Ensure proper contrast ratios
const contrastPairs = {
  'white-on-primary': 'WCAG AA compliant',
  'gray900-on-white': 'WCAG AAA compliant',
  'primary-on-accent': 'WCAG AA compliant',
};
```

### High Contrast Support
```javascript
// High contrast mode adjustments
const highContrastColors = {
  border: '#000000',        // Pure black borders
  text: '#000000',          // Pure black text
  background: '#ffffff',    // Pure white background
  focus: '#0066cc',         // High contrast focus
};
```

### Color Blindness Support
```javascript
// Color blind friendly palette
const colorBlindSafe = {
  success: '#10b981',  // Green (safe)
  warning: '#f59e0b',  // Amber (safe)
  error: '#ef4444',    // Red (use with patterns)
  info: '#3b82f6',     // Blue (safe)
};
```

## Performance Considerations

### Color Optimization
```javascript
// Efficient color usage
const optimizations = {
  'static-colors': 'Define once, reuse everywhere',
  'theme-caching': 'Cache theme objects to prevent recreating',
  'conditional-loading': 'Load only needed theme variants',
  'color-interpolation': 'Use for smooth transitions'
};
```

### Bundle Size Management
- **Tree shaking** - Export only used colors
- **Color constants** - Define once, import everywhere
- **Theme splitting** - Separate themes if needed
- **Compression** - Minify color definitions

## Testing Guidelines

### Color Testing
```javascript
// Test color contrast ratios
const testContrast = (foreground, background) => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA standard
};

// Test theme completeness
const testTheme = (theme) => {
  const requiredKeys = ['primary', 'secondary', 'background', 'text'];
  return requiredKeys.every(key => theme[key]);
};
```

### Visual Regression Testing
- **Screenshot comparisons** - Ensure consistent rendering
- **Theme switching** - Test role-based theme changes
- **Accessibility testing** - Verify contrast ratios
- **Cross-platform** - Test on iOS and Android

## Future Considerations

### Dynamic Theming
```javascript
// Potential future enhancements
const futureFeatures = {
  'custom-themes': 'User-defined color schemes',
  'seasonal-themes': 'Holiday and special event themes',
  'school-branding': 'Custom school color integration',
  'accessibility-themes': 'Enhanced accessibility options'
};
```

### Theme Versioning
```javascript
// Version management for theme updates
const themeVersion = {
  version: '1.0.0',
  adminTheme: adminTheme,
  waliTheme: waliTheme,
  migration: 'Handle theme structure changes'
};
```