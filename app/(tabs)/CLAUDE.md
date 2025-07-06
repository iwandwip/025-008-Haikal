# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/app/(tabs)` directory.

## Directory Overview

The `/app/(tabs)` directory contains the parent (Wali) interface screens for the Smart Bisyaroh system. This provides a tab-based navigation for parents to manage their child's payment status and profile.

## Parent Interface Architecture

### Layout Structure
- **`_layout.jsx`** - Bottom tab navigator with green theme for parents
- **Tab-based navigation** with payment status, profile, and logout

### Parent Interface Screens

#### Main Screens
- **`index.jsx`** - Payment status dashboard with history and credit balance
- **`profile.jsx`** - View and manage parent/student profile
- **`edit-profile.jsx`** - Edit profile information (hidden from tabs)

#### Special Tab Actions
- **`logout.jsx`** - Logout tab that triggers confirmation dialog

## Key Features

### Payment Status Dashboard
The main screen provides comprehensive payment management:

```javascript
// Payment status with credit system
const processPayment = async (paymentData) => {
  if (creditBalance >= paymentData.amount) {
    // Use credit for payment
    await processPaymentWithCredit(paymentData);
  } else {
    // Hardware payment flow
    await processHardwarePayment(paymentData);
  }
};
```

### Credit Balance Management
- **Real-time balance** - Live credit balance display
- **Overpayment handling** - Automatic credit accumulation
- **Credit usage** - Pay with available credit
- **Balance notifications** - Credit updates and alerts

### Payment History
- **Timeline-based** - Organized by payment periods
- **Status tracking** - Paid, pending, overdue
- **Payment details** - Amount, date, method
- **Refresh control** - Pull-to-refresh functionality

## Theme and Styling

### Parent Theme Colors
- **Primary**: Green (`#10b981`)
- **Secondary**: Light green variations
- **Accent**: Complementary colors
- **Status colors**: Green (paid), yellow (pending), red (overdue)

### Tab Navigation Design
- **Bottom tabs** with emoji icons
- **Green theme** for parent interface
- **Active/inactive states** with color coding
- **Consistent spacing** and typography

## Navigation Flow

```
Parent Tab Interface
├── Payment Status (index.jsx)
│   ├── Payment Modal (PaymentModal component)
│   └── Credit Balance (CreditBalance component)
├── Profile (profile.jsx)
│   └── Edit Profile (edit-profile.jsx)
└── Logout (logout.jsx - action only)
```

## Core Components

### Payment Modal
- **Payment processing** - Cash or credit payments
- **Amount validation** - Correct payment amounts
- **Loading states** - Visual feedback during processing
- **Success/error handling** - User feedback

### Credit Balance Display
- **Real-time updates** - Live balance monitoring
- **Visual indicators** - Balance status colors
- **Usage tracking** - Credit transaction history
- **Notification integration** - Balance change alerts

## Parent Operations

### Payment Processing
```javascript
// Manual payment update
const updatePayment = async (paymentId, amount) => {
  const result = await updateWaliPaymentStatus(paymentId, amount);
  if (result.success) {
    showPaymentSuccessNotification(result.data);
    await loadPaymentData(); // Refresh
  }
};
```

### Credit System
```javascript
// Credit balance management
const creditBalance = await getCreditBalance(userId);
const canPayWithCredit = creditBalance >= paymentAmount;

if (canPayWithCredit) {
  await processPaymentWithCredit(paymentData);
} else {
  // Show payment modal for cash payment
  setPaymentModalVisible(true);
}
```

## Service Integration

### Core Services Used
- **`waliPaymentService`** - Payment processing for parents
- **`paymentStatusManager`** - Payment calculation and status
- **`getCreditBalance`** - Credit balance management
- **`processPaymentWithCredit`** - Credit-based payments

### Real-time Updates
- **Auto-refresh** - Periodic data updates
- **Pull-to-refresh** - Manual refresh control
- **Focus-based updates** - Refresh when screen gains focus
- **AppState handling** - Update when app becomes active

## User Experience

### Loading States
- **Skeleton screens** - Content placeholders
- **Refresh indicators** - Pull-to-refresh feedback
- **Payment processing** - Modal loading states
- **Tab switching** - Smooth transitions

### Error Handling
- **Network errors** - Offline state handling
- **Payment failures** - Clear error messages
- **Data loading** - Retry mechanisms
- **User feedback** - Toast notifications

### Accessibility
- **Screen reader support** - Proper labels and hints
- **Touch targets** - Adequate button sizes
- **Color contrast** - Accessible color combinations
- **Navigation** - Clear tab labels

## Development Guidelines

### Adding New Tab Screens
1. Create new screen in `/app/(tabs)/` directory
2. Add tab to `_layout.jsx` with proper options
3. Follow green theme for parent interface
4. Implement proper data loading and error handling
5. Add pull-to-refresh functionality

### Working with Payment Data
- Use `waliPaymentService` for all payment operations
- Implement proper loading states for async operations
- Handle credit balance updates automatically
- Show appropriate notifications for user actions

### Performance Optimization
- **Memoization** - Expensive calculations
- **FlatList optimization** - Large payment lists
- **State management** - Minimal re-renders
- **Data caching** - Reduce API calls

## Testing Considerations

### Test Cases
- **Payment history loading** - Data fetch scenarios
- **Credit balance updates** - Real-time balance changes
- **Payment processing** - Cash and credit payments
- **Tab navigation** - Smooth transitions
- **Refresh functionality** - Pull-to-refresh behavior

### Development Helpers
- **Test accounts** - Generated via seeder
- **Mock payments** - Simulated payment data
- **Credit simulation** - Test credit scenarios
- **Error simulation** - Network failure handling

## Security Considerations

### Data Protection
- **User isolation** - Parents see only their child's data
- **Payment validation** - Server-side verification
- **Credit protection** - Secure balance management
- **Session security** - Proper logout handling

### Role-Based Access
- **Parent-only screens** - Route protection
- **Data filtering** - User-specific data only
- **Profile security** - Secure profile updates
- **Payment authorization** - Authorized transactions only