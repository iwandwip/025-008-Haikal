# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/components` directory.

## Directory Overview

The `/components` directory contains all reusable UI components and utilities for the Smart Bisyaroh system. This follows a modular component architecture for maximum reusability across the application.

## Component Architecture

### Directory Structure
```
components/
├── AuthGuard.jsx           # Authentication route protection
├── ErrorBoundary.jsx       # Error handling wrapper
├── auth/                   # Authentication-specific components
├── ui/                     # Core UI components
└── illustrations/          # SVG illustrations and graphics
```

### Core Components

#### Root Level Components
- **`AuthGuard.jsx`** - Route protection based on authentication status
- **`ErrorBoundary.jsx`** - Error boundary for crash prevention and recovery

## Key Features

### Authentication Guard
Provides route-level protection with flexible authentication requirements:

```javascript
// Protect authenticated routes
<AuthGuard requireAuth={true}>
  <AdminDashboard />
</AuthGuard>

// Protect guest-only routes  
<AuthGuard requireAuth={false}>
  <LoginScreen />
</AuthGuard>
```

### Error Boundary
Global error handling with user-friendly recovery options:

```javascript
// Wrap app sections for error protection
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Automatic error catching and recovery UI
// Shows "Terjadi Kesalahan" with retry button
```

## Component Categories

### `/auth` - Authentication Components
Specialized components for authentication flows:
- Form components for login/register
- Validation helpers
- Authentication state management

### `/ui` - Core UI Components  
Reusable interface components:
- **Buttons** - Various button styles and states
- **Inputs** - Form input components with validation
- **Modals** - Payment and confirmation modals
- **Data Display** - Tables, lists, and cards
- **Feedback** - Loading spinners, notifications, toasts

### `/illustrations` - SVG Graphics
Custom SVG illustrations for the app:
- Login and registration graphics
- Empty state illustrations
- Educational graphics for TPQ context

## Design System

### Theme Integration
All components use the theme system:

```javascript
import { getThemeByRole } from "../constants/Colors";

const colors = getThemeByRole(isAdmin);
// Admin: Blue theme
// Wali: Green theme
```

### Common Patterns
- **Role-based theming** - Automatic color switching
- **Loading states** - Consistent loading indicators
- **Error handling** - Standardized error displays
- **Accessibility** - Screen reader support
- **Responsive design** - Mobile-first approach

## Component Props Standards

### Common Props Pattern
```javascript
// Standard component interface
const Component = ({
  // Core functionality
  title,
  onPress,
  disabled = false,
  loading = false,
  
  // Styling
  style,
  variant = "default",
  size = "medium",
  
  // Theme
  color,
  theme,
  
  // Accessibility
  accessibilityLabel,
  accessibilityHint
}) => {
  // Component implementation
};
```

### Validation Props
```javascript
// Form component pattern
const InputComponent = ({
  value,
  onChangeText,
  placeholder,
  error,
  touched,
  validateOnBlur = true,
  validationRules = []
}) => {
  // Input implementation with validation
};
```

## Development Guidelines

### Creating New Components
1. **Choose appropriate category** - `/ui`, `/auth`, or `/illustrations`
2. **Follow naming conventions** - PascalCase for components
3. **Implement theme support** - Use `getThemeByRole()` for colors
4. **Add prop validation** - Use PropTypes or TypeScript
5. **Include loading states** - Handle async operations
6. **Support accessibility** - Add proper labels and hints
7. **Export from index** - Add to category index file

### Component Best Practices
- **Single responsibility** - One purpose per component
- **Composition over inheritance** - Use composition patterns
- **Prop drilling avoidance** - Use Context for deep props
- **Performance optimization** - Use React.memo for expensive components
- **Error boundaries** - Wrap components that might fail

### Testing Components
- **Unit tests** - Test component behavior
- **Integration tests** - Test with parent components
- **Accessibility tests** - Screen reader compatibility
- **Visual tests** - Screenshot comparisons
- **Theme tests** - Test both admin and wali themes

## Common Component Patterns

### Loading States
```javascript
const Component = ({ loading, children }) => {
  if (loading) {
    return <LoadingSpinner text="Memuat..." />;
  }
  return children;
};
```

### Error Handling
```javascript
const Component = ({ error, onRetry }) => {
  if (error) {
    return (
      <ErrorDisplay 
        message={error.message}
        onRetry={onRetry}
      />
    );
  }
  // Normal render
};
```

### Theme-aware Styling
```javascript
const Component = ({ isAdmin }) => {
  const colors = getThemeByRole(isAdmin);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
};
```

## Integration with Services

### Authentication Integration
```javascript
// Using AuthContext in components
const { currentUser, userProfile, isAdmin } = useAuth();

// Role-based rendering
if (isAdmin) {
  return <AdminComponent />;
} else {
  return <WaliComponent />;
}
```

### Notification Integration
```javascript
// Using notification context
const { showGeneralNotification } = useNotification();

const handleAction = async () => {
  try {
    await performAction();
    showGeneralNotification("Berhasil", "Aksi berhasil dilakukan", "success");
  } catch (error) {
    showGeneralNotification("Error", error.message, "error");
  }
};
```

## Performance Considerations

### Component Optimization
- **React.memo()** - Prevent unnecessary re-renders
- **useMemo()** - Cache expensive calculations
- **useCallback()** - Stable function references
- **Lazy loading** - Dynamic imports for large components

### Bundle Size Management
- **Tree shaking** - Import only needed components
- **Component splitting** - Separate by feature
- **Icon optimization** - Use emoji or optimized SVGs
- **Image optimization** - Proper image sizing and formats

## Accessibility Guidelines

### Screen Reader Support
- **Semantic elements** - Use proper HTML semantics
- **ARIA labels** - Descriptive accessibility labels
- **Focus management** - Proper tab order
- **Content description** - Clear content hierarchy

### Touch Accessibility
- **Minimum touch targets** - 44px minimum size
- **Touch feedback** - Visual feedback on touch
- **Gesture support** - Standard mobile gestures
- **Error prevention** - Clear form validation