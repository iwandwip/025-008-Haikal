# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/components/ui` directory.

## Directory Overview

The `/components/ui` directory contains all core UI components for the Smart Bisyaroh system. These are highly reusable, theme-aware components that form the foundation of the application's interface.

## Core UI Components

### Form Components
- **`Button.jsx`** - Multi-variant button with role-based theming
- **`Input.jsx`** - Form input with validation, focus states, and password toggle
- **`DatePicker.jsx`** - Date selection component for timelines
- **`TimelinePicker.jsx`** - Specialized picker for payment timelines

### Data Display
- **`DataTable.jsx`** - Sortable, searchable data table for student lists
- **`CreditBalance.jsx`** - Real-time credit balance display with animations
- **`LoadingSpinner.jsx`** - Consistent loading indicator with custom text

### Modal & Overlay
- **`PaymentModal.jsx`** - Advanced payment processing modal with hardware integration
- **`ToastNotification.jsx`** - Global toast notification system

### Utility Components
- **`IllustrationContainer.jsx`** - Wrapper for SVG illustrations with responsive sizing

## Key Features

### Role-Based Theming
All UI components automatically adapt to user roles:

```javascript
// Automatic theme switching
const { isAdmin } = useAuth();
const theme = getThemeByRole(isAdmin);

// Admin: Blue theme (#3b82f6)
// Wali: Green theme (#10b981)
```

### Button Component
Flexible button with multiple variants:

```javascript
<Button
  title="Submit"
  variant="primary" // 'primary' | 'secondary' | 'outline'
  onPress={handleSubmit}
  disabled={loading}
  style={customStyle}
/>
```

### Input Component
Feature-rich input with validation:

```javascript
<Input
  label="Email"
  placeholder="Masukkan email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  error={emailError}
  secureTextEntry={false} // Password toggle for secure inputs
/>
```

### Payment Modal
Revolutionary hardware-integrated payment processing:

```javascript
<PaymentModal
  visible={modalVisible}
  payment={selectedPayment}
  onClose={() => setModalVisible(false)}
  onPaymentSuccess={handlePaymentSuccess}
  creditBalance={creditBalance}
  userProfile={userProfile}
/>
```

## Component Architecture

### Theme Integration
```javascript
// Standard theme usage pattern
const Component = () => {
  const { isAdmin } = useAuth();
  const theme = getThemeByRole(isAdmin);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text }}>Content</Text>
    </View>
  );
};
```

### Loading States
```javascript
// Consistent loading pattern
const Component = ({ loading, children }) => {
  if (loading) {
    return <LoadingSpinner text="Memuat..." />;
  }
  return children;
};
```

### Error Handling
```javascript
// Input validation pattern
const Input = ({ error, ...props }) => {
  const getInputStyle = () => ({
    borderColor: error ? theme.error : theme.gray300
  });
  
  return (
    <View>
      <TextInput style={getInputStyle()} {...props} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
```

## Advanced Components

### PaymentModal Features
The payment modal showcases the revolutionary mode-based architecture:

- **Hardware Integration** - Direct ESP32 communication via RTDB
- **Dual Payment Methods** - Hardware (cash) and app (credit) payments
- **Real-time Progress** - Live payment status updates
- **Timeout Management** - App-managed timeouts for hardware operations
- **Credit System** - Automatic credit balance integration

```javascript
// Hardware payment flow
const startHardwarePayment = async () => {
  const result = await startHardwarePaymentWithTimeout(paymentData, 60);
  if (result.success) {
    // Subscribe to real-time updates
    subscribeToPaymentProgress(handleProgress);
    subscribeToPaymentResults(handleResults);
  }
};
```

### DataTable Features
Comprehensive data management for admin operations:

- **Sorting** - Multi-column sorting capabilities
- **Search** - Real-time search filtering
- **Pagination** - Efficient large dataset handling
- **Actions** - Row-level action buttons
- **Responsive** - Mobile-optimized layout

### CreditBalance Features
Real-time credit monitoring:

- **Live Updates** - Automatic balance refresh
- **Visual Indicators** - Color-coded balance status
- **Animation** - Smooth balance change animations
- **Transaction History** - Recent credit usage display

## Design System

### Typography Scale
```javascript
const typography = {
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
  small: { fontSize: 12, fontWeight: 'normal' }
};
```

### Spacing System
```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

### Color System
```javascript
// Role-based color tokens
const colors = {
  // Admin theme
  adminPrimary: '#3b82f6',
  adminSecondary: '#dbeafe',
  
  // Wali theme  
  waliPrimary: '#10b981',
  waliSecondary: '#d1fae5',
  
  // Semantic colors
  success: '#059669',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
};
```

## Development Guidelines

### Creating New UI Components
1. **Theme integration** - Use `getThemeByRole()` for colors
2. **Prop validation** - Define clear prop interfaces
3. **Accessibility** - Add proper labels and hints
4. **Loading states** - Handle async operations
5. **Error states** - Graceful error display
6. **Responsive design** - Mobile-first approach

### Component Standards
```javascript
const UIComponent = ({
  // Core props
  children,
  style,
  disabled = false,
  loading = false,
  
  // Event handlers
  onPress,
  onFocus,
  onBlur,
  
  // Accessibility
  accessibilityLabel,
  accessibilityHint,
  
  // Theme override
  color,
  variant = 'default'
}) => {
  const { isAdmin } = useAuth();
  const theme = getThemeByRole(isAdmin);
  
  // Component implementation
};
```

### Performance Optimization
- **React.memo()** - Prevent unnecessary re-renders
- **useMemo()** - Cache expensive style calculations
- **useCallback()** - Stable event handlers
- **Lazy imports** - Dynamic component loading

## Hardware Integration

### Mode-Based Communication
UI components can directly interface with ESP32 hardware:

```javascript
// Start hardware operation from UI
const handleHardwareAction = async () => {
  const result = await setMode('payment');
  if (result.success) {
    // UI shows real-time progress
    subscribeToModeChanges(updateUI);
  }
};
```

### Real-time Updates
Components support live data synchronization:

```javascript
// Real-time payment status
useEffect(() => {
  const unsubscribe = subscribeToPaymentResults((result) => {
    setPaymentStatus(result);
    showNotification(result.message);
  });
  
  return unsubscribe;
}, []);
```

## Testing Guidelines

### Unit Testing
- **Component rendering** - Verify proper output
- **Props handling** - Test all prop combinations
- **Event handling** - Simulate user interactions
- **Theme switching** - Test both admin and wali themes
- **Error states** - Test error boundary integration

### Integration Testing
- **Form validation** - Complete form workflows
- **Hardware simulation** - Mock ESP32 responses
- **Payment flows** - End-to-end payment testing
- **Navigation** - Cross-component navigation

### Accessibility Testing
- **Screen reader** - VoiceOver/TalkBack compatibility
- **Keyboard navigation** - Tab order and focus
- **Color contrast** - WCAG compliance
- **Touch targets** - Minimum size requirements

## Common Usage Patterns

### Form Building
```javascript
const LoginForm = () => (
  <>
    <Input
      label="Email"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      error={emailError}
    />
    <Input
      label="Password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
      error={passwordError}
    />
    <Button
      title="Masuk"
      onPress={handleLogin}
      disabled={!isFormValid}
      loading={isLoading}
    />
  </>
);
```

### Data Display
```javascript
const StudentList = () => (
  <DataTable
    data={students}
    columns={studentColumns}
    searchable
    sortable
    onRowPress={viewStudent}
    actions={[
      { label: 'Edit', onPress: editStudent },
      { label: 'Delete', onPress: deleteStudent }
    ]}
  />
);
```

### Payment Processing
```javascript
const PaymentScreen = () => (
  <>
    <CreditBalance balance={creditBalance} />
    <PaymentModal
      visible={modalVisible}
      payment={selectedPayment}
      onPaymentSuccess={refreshData}
      creditBalance={creditBalance}
    />
  </>
);
```