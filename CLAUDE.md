# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Bisyaroh is a revolutionary IoT-enabled payment management system for TPQ (Islamic religious schools) that combines a React Native mobile app with ESP32 hardware. The system features automated RFID-based student identification, AI-powered currency recognition, and real-time payment processing.

## Technology Stack

- **Frontend**: React Native 0.79.3, Expo SDK 53, React 19.0.0, Expo Router 5.1.0
- **Backend**: Firebase 10.14.0 (Authentication, Firestore, Realtime Database)
- **Hardware**: ESP32 with Arduino Framework, RFID reader, color sensor, LCD display
- **State Management**: React Context (AuthContext, ThemeContext, NotificationContext)

## Key Architecture Patterns

### Revolutionary Mode-Based ESP32 Communication
The system uses a simplified mode-based architecture for hardware communication:
- **Single mode field** controls entire ESP32 state (`idle`, `solenoid`, `pairing`, `payment`)
- **90% code reduction** on ESP32 firmware vs legacy JSON approach
- **Real-time coordination** via Firebase Realtime Database
- **App-managed timeouts** eliminate ESP32 complexity

### Multi-Role System
- **Admin Panel**: Complete management dashboard (blue theme)
- **Parent Interface**: Payment tracking and management (green theme)
- **Role-based access control** with Firebase Authentication
- **Special admin account**: `admin@gmail.com` (any password)

### Data Bridge Pattern
- **RTDB for real-time coordination** with hardware
- **Firestore for persistent storage** with comprehensive data
- **Automatic synchronization** between databases
- **Self-cleaning data patterns** with automatic reset

## Available Scripts

```bash
# Development
npm start                    # Start Expo development server
npm run android             # Run on Android
npm run ios                 # Run on iOS
npm run web                 # Run on web

# Platform-specific clearing
npm run clear               # Clear cache and restart
npm run reset               # Reset cache and restart

# Testing & Utilities
npm run test                # Run ESP32 simulator for testing
npm run cleanup             # Interactive Firebase database cleanup

# Production builds (EAS)
npm run build:android:production    # Build Android APK
npm run build:ios:production        # Build iOS IPA
npm run build:all:preview          # Build all platforms (preview)
```

## Project Structure

- **`/app/`** - Expo Router file-based navigation
  - `(auth)/` - Authentication screens (admin/parent login)
  - `(admin)/` - Admin panel with student management, payment processing
  - `(tabs)/` - Parent interface with payment status, profile management
- **`/services/`** - Business logic layer
  - `rtdbModeService.js` - Revolutionary mode-based hardware communication
  - `dataBridgeService.js` - RTDB ↔ Firestore synchronization
  - `paymentStatusManager.js` - Intelligent payment status calculation
  - `pairingService.js` - RFID card pairing with timeout handling
- **`/components/`** - Reusable UI components
  - `/ui/` - Core components (Button, Input, DataTable, PaymentModal)
  - `/auth/` - Authentication components
  - `/illustrations/` - SVG illustrations
- **`/contexts/`** - React Context providers for global state
- **`/firmware/`** - ESP32 Arduino firmware
  - `HaikalFirmwareR1/` - Latest mode-based architecture
  - `HaikalFirmwareR0/` - Legacy complex implementation

## Core Services

### Hardware Communication (`rtdbModeService.js`)
```javascript
// Revolutionary ultra-simple mode system
const modes = {
  idle: 'idle',         // Default state
  solenoid: 'solenoid', // Solenoid control
  pairing: 'pairing',   // RFID pairing
  payment: 'payment'    // Payment processing
};

// Set mode with priority system
await rtdbModeService.setMode('pairing');
```

### Data Synchronization (`dataBridgeService.js`)
- Bridges RFID pairing results from RTDB to Firestore
- Processes hardware payments with credit system
- Comprehensive audit logging
- Auto-cleanup of temporary data

### Payment Processing (`waliPaymentService.js`, `adminPaymentService.js`)
- Timeline-based payment schedules
- Credit system with overpayment handling
- Mixed payment processing (cash + credit)
- Real-time status updates

## Database Schema

### Firestore Collections
- **`users`** - User profiles with role-based access (`admin` | `user`)
- **`active_timeline`** - Payment schedules with periods and holidays
- **`payments/{timelineId}/periods/{periodKey}/santri_payments/{santriId}`** - Individual payment records
- **`bridge_logs`** - Audit trail for RTDB-Firestore synchronization

### Realtime Database (Mode-Based)
```json
{
  "mode": "idle",              // Single source of truth
  "pairing_mode": "",          // RFID code when detected
  "payment_mode": {            // Payment processing data
    "get": { "user_id": "", "amount_required": "" },
    "set": { "amount_detected": "", "status": "" }
  },
  "solenoid_command": "locked" // Direct hardware control
}
```

## Development Workflow

### Testing Hardware Integration
```bash
npm run test  # Interactive ESP32 simulator
```

### Database Management
```bash
npm run cleanup  # Interactive Firebase cleanup tool
```

### Firebase Setup
1. Create Firebase project with Authentication, Firestore, and Realtime Database
2. Configure security rules for role-based access
3. Update Firebase config in `services/firebase.js`
4. Default admin account: `admin@gmail.com` (any password)

### ESP32 Firmware
- Use Arduino IDE to upload firmware from `firmware/HaikalFirmwareR1/`
- Configure WiFi credentials via LCD menu
- Set Firebase project URL in firmware

## Key Features

### RFID Pairing System
- **1-second response time** for card assignment
- **Admin-controlled** pairing process
- **Timeout handling** with automatic cleanup
- **Real-time status updates** across all interfaces

### Currency Recognition
- **KNN machine learning** for Indonesian Rupiah detection
- **TCS3200 color sensor** for RGB analysis
- **Supports 2000, 5000, 10000 IDR bills**
- **High accuracy** with confidence scoring

### Payment Timeline System
- **Flexible schedules** (daily, weekly, monthly, yearly)
- **Holiday management** with automatic exclusions
- **Credit system** for overpayment handling
- **Auto-status updates** for late payments

## Role-Based Theming

- **Admin Theme**: Blue color scheme (`#2563eb` primary)
- **Parent Theme**: Green color scheme (`#059669` primary)
- **Dynamic theming** based on user role
- **Consistent UI patterns** across roles

## Special Considerations

### Authentication Flow
1. Role selection (Admin vs Parent)
2. Role-specific login screens
3. Automatic role detection and routing
4. Session persistence with AsyncStorage

### Hardware Integration
- System operates in **single mode** at a time
- **Priority system** prevents race conditions
- **App-managed timeouts** for all operations
- **Automatic cleanup** of temporary data

### Performance Optimizations
- **Throttled status updates** to prevent excessive API calls
- **Caching** for frequently accessed data
- **Lazy loading** for large datasets
- **Optimized re-renders** with React.memo

## Common Development Tasks

### Adding New Payment Features
1. Update payment services (`waliPaymentService.js` or `adminPaymentService.js`)
2. Modify UI components in `/components/ui/`
3. Update database schema if needed
4. Test with ESP32 simulator

### Modifying Hardware Communication
1. Update `rtdbModeService.js` for new modes
2. Modify ESP32 firmware if needed
3. Update `dataBridgeService.js` for data synchronization
4. Test with hardware simulator

### Adding New UI Components
1. Create component in `/components/ui/`
2. Follow existing theming patterns
3. Add role-based styling if needed
4. Export from appropriate index file

## Production Deployment

### Mobile App
```bash
npm run build:android:production  # Android APK
npm run build:ios:production      # iOS IPA
```

### Hardware Setup
1. Upload firmware to ESP32
2. Configure WiFi via LCD menu
3. Set Firebase project URL
4. Test all hardware components

### Security Configuration
- Configure Firestore security rules
- Set up Firebase Authentication rules
- Use environment variables for sensitive data
- Enable audit logging for production

## Troubleshooting

### Common Issues
- **Firebase connection**: Check network connectivity and config
- **RFID pairing timeout**: Verify ESP32 online status
- **Payment processing errors**: Check credit balance and timeline status
- **Authentication failures**: Verify user role and permissions

### Debug Tools
- ESP32 simulator for hardware testing
- Firebase cleanup tool for database management
- Real-time mode status monitoring
- Comprehensive audit logging

## Version Information

Current version: v1.2.0 with revolutionary mode-based architecture achieving:
- 90% code reduction on ESP32 firmware
- 98% memory reduction (5KB → 100 bytes)
- 5x faster response time (5s → 1s)
- Ultra-simple string-based communication