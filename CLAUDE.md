# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Bisyaroh** - A comprehensive IoT-enabled payment management system for TPQ (Taman Pendidikan Quran) Ibadurrohman. This system combines a React Native mobile application with ESP32 IoT hardware to provide automated RFID-based student identification, intelligent payment processing with machine learning, and real-time financial management for Islamic religious schools.

### Core System Components
- **Mobile Application**: React Native + Expo SDK 53 cross-platform app
- **IoT Hardware**: ESP32 with RFID reader, color sensor, LCD display, solenoid control
- **Machine Learning**: KNN algorithm for currency recognition (2000, 5000, 10000 IDR)
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Payment Processing**: Timeline-based automated payment management with credit system
- **Hardware Integration**: Revolutionary mode-based architecture for ESP32 communication

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development  
npm run android
npm run ios
npm run web

# Clear cache when needed
npm run clear
npm run reset

# Testing and utilities
npm run test              # Run ESP32 simulator
npm run cleanup           # Clean up Firebase data

# EAS Build System (Production builds)
npm run eas:login         # Login to EAS
npm run eas:configure     # Configure build settings
npm run build:android:preview     # Android preview build
npm run build:android:production  # Android production build
npm run build:ios:preview         # iOS preview build
npm run build:ios:production      # iOS production build
npm run build:all:preview         # All platforms preview
npm run build:development         # Development build (Android)
npm run submit:android            # Submit to Play Store
npm run submit:ios               # Submit to App Store
```

## Architecture

### Multi-Role System
- **Admin**: Complete management access via `app/(admin)/` routes
- **User (Wali)**: Parent/guardian access via `app/(tabs)/` routes
- Authentication handled through `contexts/AuthContext.jsx`

### Key Technologies
- **React Native + Expo SDK 53**
- **Firebase** (Authentication + Firestore)
- **Expo Router** for file-based navigation
- **ESP32 Arduino firmware** with RFID integration

### Service Layer
All business logic is separated into service files:

**Core Services:**
- `authService.js` - Authentication operations and session management
- `userService.js` - Student/parent (wali) management and CRUD operations
- `adminPaymentService.js` - Admin payment operations and timeline management
- `waliPaymentService.js` - Parent payment operations and credit management
- `timelineService.js` - Payment schedule creation and period management
- `paymentStatusManager.js` - Payment status calculation and updates
- `seederService.js` - Development data seeding utilities

**Hardware Integration Services:**
- `rtdbModeService.js` - **Revolutionary mode-based ESP32 communication architecture**
- `dataBridgeService.js` - Data synchronization between RTDB and Firestore
- `pairingService.js` - RFID card-to-student mapping and real-time pairing

**Legacy Services (DEPRECATED):**
- `hardwarePaymentService.js` - ⚠️ **DEPRECATED** - Replaced by mode-based architecture
- `solenoidControlService.js` - ⚠️ **DEPRECATED** - Replaced by mode-based architecture

### State Management
Global state via React Context:
- `AuthContext` - User authentication, role management, and session persistence
- `SettingsContext` - App configuration and preferences
- `NotificationContext` - Toast notifications and user feedback
- `ThemeContext` - Theme switching and appearance management

## Hardware Integration

### Revolutionary Mode-Based Architecture
The system now uses an **ultra-simplified mode-based communication architecture** that dramatically improves performance:

**Performance Improvements:**
- **90% code reduction** on ESP32 side
- **98% memory reduction** (5KB → 100 bytes)
- **5x faster response time** (5s → 1s polling)
- **Ultra-simple string operations** vs complex JSON parsing

**Mode-Based Communication:**
```cpp
// ESP32 Implementation (Ultra-Simple)
void loop() {
  String currentMode = Firebase.getString(firebaseData, "mode");
  
  if (currentMode == "idle") {
    handleIdleMode();
  } else if (currentMode == "pairing") {
    handlePairingMode();
  } else if (currentMode == "payment") {
    handlePaymentMode();
  }
  
  handleSolenoidControl();
  delay(1000); // 1-second polling vs 5-second
}
```

**Mode Priority System:**
- `idle` (Priority 0) - Default state
- `solenoid` (Priority 1) - Solenoid control operations
- `pairing` (Priority 2) - RFID card pairing mode
- `payment` (Priority 3) - Payment processing mode

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **RFID reading** (MFRC522) for student identification
- **KNN algorithm** for currency recognition using TCS3200 color sensor
- **WiFi connectivity** for Firebase real-time synchronization
- **LCD menu system** with button controls for device configuration
- **Multi-sensor integration** with LEDs, buzzer, servo, solenoid, and relay outputs
- **NTP time synchronization** for accurate payment timestamps
- **Mode-based communication** with ultra-simple string operations

### Key Firmware Components
- `KNN.ino` - K-Nearest Neighbors algorithm for currency recognition (2000, 5000, 10000 IDR)
- `WiFi.ino` - WiFi management, Firebase connectivity, and NTP synchronization
- `Menu.ino` - LCD interface with 3-button navigation system
- `USBComs.ino` - Serial communication for debugging and configuration
- `Header.h` - Global configuration, pin definitions, and sensor parameters

### Additional Testing Firmware
Located in `firmware/Testing/` for component testing:
- `TestLCD16x2/` - LCD display testing
- `TestRFID/` - RFID reader testing
- `TestRTC_DS3231/` - Real-time clock testing
- `TestRelay/` - Relay control testing
- `TestServo180/` - Servo motor testing
- `TestTCS3200/` - Color sensor testing

## Important Implementation Details

### Authentication
- Special admin account: `admin@gmail.com` (accepts any password)
- Regular users authenticate with email/password via Firebase
- Role-based routing enforced in `_layout.jsx` files

### Payment System
- Timeline-based payment schedules configurable by admin
- Real-time status updates via Firebase listeners
- Payment status managed through `paymentStatusManager.js`
- Complex validation logic in `utils/paymentStatusUtils.js`

### RFID Integration & Mode-Based Communication
- Students paired with RFID cards via `pairingService.js` and `rtdbModeService.js`
- **Real-time pairing mode** with timeout management and automatic cleanup
- Card scans trigger payment processing through mode-based architecture
- **Data bridge pattern** - RTDB for real-time coordination, Firestore for permanent storage
- **Ultra-responsive hardware** with 1-second polling vs previous 5-second polling
- **App-managed timeouts** eliminate ESP32 complexity

### Solenoid Control System
- **Simple string commands** via `rtdbModeService.js`: `"locked"`, `"unlocked"`
- **App-managed timing** - Hardware no longer handles complex timeout logic
- **Immediate response** - 1-second polling for instant lock/unlock operations
- **Automatic reset** - System automatically returns to locked state after timeout

### Database Structure

**Firebase Firestore (Persistent Storage):**
- `users` - Student and parent (wali) accounts with role-based access
- `active_timeline` - Current active payment schedule with periods and amounts
- `payments/{timelineId}/periods/{periodKey}/santri_payments/{santriId}` - Hierarchical payment records
- `bridge_logs` - Data bridge operation monitoring and debugging
- `rfid_pairing` - Historical RFID card pairing records

**Firebase Realtime Database (Real-time Coordination):**
- `mode` - Current system mode (idle/solenoid/pairing/payment)
- `pairing_mode` - RFID pairing session data
- `payment_mode` - Hardware payment session data  
- `solenoid_command` - Solenoid control commands (locked/unlocked)

**Data Bridge Architecture:**
- **RTDB** handles real-time hardware coordination (temporary data)
- **Firestore** handles persistent storage and complex queries (permanent data)
- **dataBridgeService.js** synchronizes successful operations from RTDB to Firestore
- **Self-cleaning** - RTDB data automatically cleaned up after operations

## Detailed Database Schema

### users Collection
```javascript
{
  id: string,
  email: string,
  role: 'admin' | 'user',
  deleted: boolean,
  
  // Admin users
  nama?: string,
  noHp?: string,
  
  // Student/parent users
  namaSantri?: string,
  namaWali?: string,
  noHpWali?: string,
  rfidSantri?: string,
  creditBalance?: number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### active_timeline Collection
```javascript
{
  id: string,
  name: string,
  type: 'daily' | 'weekly' | 'monthly' | 'yearly',
  duration: number,
  baseAmount: number,
  totalAmount: number,
  amountPerPeriod: number,
  startDate: string,
  mode: 'auto' | 'manual',
  simulationDate?: string,
  holidays: number[],
  periods: {
    [periodKey]: {
      number: number,
      label: string,
      dueDate: string,
      active: boolean,
      amount: number,
      isHoliday: boolean
    }
  },
  status: 'active',
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Records Structure
```
payments/
├── {timelineId}/
    ├── periods/
        ├── {periodKey}/
            ├── santri_payments/
                ├── {santriId}/ → {
                    userId: string,
                    amount: number,
                    paidAmount: number,
                    status: 'belum_bayar' | 'lunas' | 'terlambat',
                    paidAt?: Date,
                    creditUsed?: number,
                    overpayment?: number
                  }
```

### rfid_pairing Collection (Firestore - Historical Records)
```javascript
{
  isActive: boolean,
  santriId: string,
  startTime: string,
  rfidCode?: string,
  status: 'waiting' | 'received' | 'cancelled',
  cancelledTime?: string,
  receivedTime?: string
}
```

### Firebase Realtime Database Schema (Mode-Based Architecture)
```json
{
  "mode": "idle",
  "pairing_mode": {
    "user_id": "string",
    "rfid_code": "string",
    "status": "completed"
  },
  "payment_mode": {
    "get": {
      "user_id": "string",
      "amount_required": "number"
    },
    "set": {
      "amount_detected": "number", 
      "status": "success|failed|insufficient"
    }
  },
  "solenoid_command": "locked"
}
```

### bridge_logs Collection (Operation Monitoring)
```javascript
{
  id: string,
  operation: 'rfid_pairing' | 'hardware_payment',
  sourceData: object,
  destinationData: object,
  success: boolean,
  error?: string,
  timestamp: Date,
  processingTime: number
}
```

## Application Flows

### Payment Timeline Creation Flow
1. **Admin creates timeline** → Configure type, duration, base amount, holidays
2. **System calculates periods** → Generate payment periods with due dates
3. **Initialize student payments** → Create payment records for all active students
4. **Activate timeline** → Set as active timeline and notify users

### Mode-Based RFID Payment Processing Flow
1. **Payment initiation** → App sets mode to "payment" with user_id and amount_required
2. **ESP32 detects mode** → Hardware switches to payment mode (1-second polling)
3. **Student scans RFID** → ESP32 validates card matches user_id
4. **Currency detection** → TCS3200 sensor + KNN algorithm identifies bill amount
5. **Payment validation** → ESP32 sets payment result in RTDB
6. **App processes result** → Validate and update Firestore via dataBridgeService
7. **Hardware feedback** → LED/buzzer confirmation, LCD display update
8. **Mode reset** → System returns to "idle" mode automatically

### Mode-Based Real-time Pairing Flow
1. **Admin initiates pairing** → App sets mode to "pairing" with user_id
2. **ESP32 detects mode** → Hardware switches to pairing mode (1-second polling)
3. **RFID detection** → Hardware captures card code and updates RTDB
4. **Data bridge** → dataBridgeService transfers successful pairing to Firestore
5. **User profile update** → Student record updated with RFID code
6. **Mode reset** → System returns to "idle" mode automatically

### Solenoid Control Flow
1. **Unlock request** → App sets solenoid_command to "unlocked"
2. **ESP32 response** → Hardware unlocks solenoid (1-second polling)
3. **App-managed timeout** → App automatically sets command back to "locked" after timeout
4. **Hardware locks** → Solenoid returns to locked state

## Hardware Specifications

### Required Components
- **ESP32 Development Board** (WiFi enabled)
- **MFRC522 RFID Reader** with cards/tags
- **TCS3200 Color Sensor** for currency recognition
- **16x2 LCD Display** with I2C interface
- **3 Push Buttons** (Up, Down, OK navigation)
- **Solenoid Lock** for physical access control
- **LEDs, Buzzer, Servo Motor, Relay** for feedback and additional outputs

### Wiring Configuration
```cpp
// RFID (MFRC522)
#define RST_PIN 22
#define SS_PIN 21

// Color Sensor (TCS3200)
#define S0 4
#define S1 16
#define S2 17
#define S3 5
#define sensorOut 18

// LCD (I2C)
#define SDA_PIN 13
#define SCL_PIN 14

// Controls
#define BUTTON_UP 25
#define BUTTON_DOWN 26
#define BUTTON_OK 27
```

### KNN Training Data
Currency recognition using RGB color values:
- **2000 IDR**: Specific RGB range for grey bills
- **5000 IDR**: Specific RGB range for brown bills  
- **10000 IDR**: Specific RGB range for purple bills

## Development Notes

### Firebase Configuration
- Configuration in `services/firebase.js` with hardcoded credentials
- **Security Note**: Move sensitive config to environment variables for production
- Firestore security rules should restrict access by user role

### Language Support
- **Primary language**: Indonesian (Bahasa Indonesia)
- All UI text, validation messages, and notifications in Indonesian
- Date formatting follows Indonesian locale

### Testing ESP32 Integration
- **Hardware requirement**: Complete ESP32 setup with all sensors and solenoid
- **Network setup**: WiFi credentials configured via LCD menu
- **Firebase connection**: Real-time database for mode-based hardware communication
- **Calibration**: Color sensor requires calibration for accurate currency detection
- **Mode testing**: Test all modes (idle, pairing, payment, solenoid) individually
- **Performance monitoring**: 1-second polling response time verification
- **ESP32 simulator**: Use `npm run test` to simulate hardware interactions

### Production Deployment
- **EAS Build**: Use EAS commands for production app builds
- **Firebase security**: Configure Firestore security rules for role-based access
- **Environment variables**: Move Firebase config to secure environment variables  
- **Hardware calibration**: Ensure color sensor calibration for different lighting conditions
- **Network reliability**: Implement robust WiFi reconnection logic in ESP32 firmware

### Common File Patterns
- **Screen components**: `app/` directory follows Expo Router file-based routing
- **UI components**: Reusable components in `components/ui/`
- **Business logic**: Service layer in `services/` with clear separation
- **Validation**: Form validation centralized in `utils/validation.js`
- **Utilities**: Helper functions in `utils/` for date handling, payment calculations

### Error Handling Patterns
- **Network errors**: Automatic retry with exponential backoff
- **Firebase errors**: User-friendly error messages in Indonesian
- **Hardware communication**: Fallback mechanisms for connection issues
- **Payment validation**: Comprehensive validation before processing

### Performance Considerations
- **Mode-based architecture**: 90% code reduction, 98% memory reduction, 5x faster response
- **Real-time listeners**: Efficient Firestore listener management  
- **Memory optimization**: Proper cleanup of subscriptions
- **Background sync**: Minimal background processing for better battery life
- **Caching**: Strategic caching of frequently accessed data
- **Data bridge pattern**: Separation of real-time coordination from persistent storage
- **Ultra-responsive hardware**: 1-second polling for immediate hardware response

## Key Architecture Innovations

### 1. Mode-Based Communication Revolution
The system introduces a **revolutionary mode-based architecture** that dramatically simplifies ESP32-app communication:

**Traditional Approach (DEPRECATED):**
- Complex JSON document management
- 5-second polling intervals
- 5KB memory usage on ESP32
- 240+ lines of complex session management code

**Mode-Based Approach (CURRENT):**
- Simple string operations (`"idle"`, `"pairing"`, `"payment"`)
- 1-second polling intervals
- 100 bytes memory usage on ESP32
- Ultra-simple if-else logic

### 2. Data Bridge Pattern
**Separation of Concerns:**
- **RTDB**: Real-time hardware coordination (temporary, fast)
- **Firestore**: Persistent storage and complex queries (permanent, structured)
- **dataBridgeService.js**: Automatic synchronization between systems

### 3. App-Managed Timeouts
**Simplified Hardware Logic:**
- ESP32 no longer handles complex timeout management
- App manages all timing logic and automatically resets modes
- Hardware focuses purely on sensor reading and actuator control

### 4. Priority-Based Mode Management
**Prevents Race Conditions:**
- Mode transitions follow priority hierarchy
- Higher priority modes can override lower priority modes
- Automatic cleanup and reset to idle state

This architecture represents a **paradigm shift** in IoT device communication, achieving dramatic performance improvements while significantly simplifying both mobile app and firmware implementation.