# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Bisyaroh** - A comprehensive payment management system for TPQ (Taman Pendidikan Quran) Ibadurrohman. This system combines a React Native mobile application with ESP32 IoT hardware to provide automated RFID-based student identification, intelligent payment processing with machine learning, and real-time financial management for Islamic religious schools.

### Core System Components
- **Mobile Application**: React Native + Expo cross-platform app
- **IoT Hardware**: ESP32 with RFID reader, color sensor, LCD display
- **Machine Learning**: KNN algorithm for currency recognition
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Payment Processing**: Timeline-based automated payment management

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

# Clean up Firebase data
npm run cleanup
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
- `authService.js` - Authentication operations and session management
- `userService.js` - Student/parent (wali) management and CRUD operations
- `adminPaymentService.js` - Admin payment operations and timeline management
- `waliPaymentService.js` - Parent payment operations and credit management
- `timelineService.js` - Payment schedule creation and period management
- `pairingService.js` - RFID card-to-student mapping and real-time pairing
- `paymentStatusManager.js` - Payment status calculation and updates
- `seederService.js` - Development data seeding utilities

### State Management
Global state via React Context:
- `AuthContext` - User authentication, role management, and session persistence
- `SettingsContext` - App configuration and preferences
- `NotificationContext` - Toast notifications and user feedback
- `ThemeContext` - Theme switching and appearance management

## Hardware Integration

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **RFID reading** (MFRC522) for student identification
- **KNN algorithm** for currency recognition using TCS3200 color sensor
- **WiFi connectivity** for Firebase real-time synchronization
- **LCD menu system** with button controls for device configuration
- **Multi-sensor integration** with LEDs, buzzer, servo, and relay outputs
- **NTP time synchronization** for accurate payment timestamps

### Key Firmware Components
- `KNN.ino` - K-Nearest Neighbors algorithm for currency recognition (2000, 5000, 10000 IDR)
- `WiFi.ino` - WiFi management, Firebase connectivity, and NTP synchronization
- `Menu.ino` - LCD interface with 3-button navigation system
- `USBComs.ino` - Serial communication for debugging and configuration
- `Header.h` - Global configuration, pin definitions, and sensor parameters

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

### RFID Integration
- Students paired with RFID cards via `pairingService.js`
- Card scans trigger payment processing
- Hardware communicates with app via Firebase real-time database

### Database Structure
Firebase Firestore collections:
- `users` - Student and parent (wali) accounts with role-based access
- `active_timeline` - Current active payment schedule with periods and amounts
- `payments/{timelineId}/periods/{periodKey}/santri_payments/{santriId}` - Hierarchical payment records
- `rfid_pairing` - Real-time RFID card pairing sessions
- Firebase Realtime Database for live hardware communication

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

### rfid_pairing Collection
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

## Application Flows

### Payment Timeline Creation Flow
1. **Admin creates timeline** → Configure type, duration, base amount, holidays
2. **System calculates periods** → Generate payment periods with due dates
3. **Initialize student payments** → Create payment records for all active students
4. **Activate timeline** → Set as active timeline and notify users

### RFID Payment Processing Flow
1. **Student scans RFID** → ESP32 reads card and identifies student
2. **Currency detection** → TCS3200 sensor + KNN algorithm identifies bill amount
3. **Payment validation** → Check against current timeline and student status
4. **Process payment** → Update Firestore, handle overpayments/credits
5. **Hardware feedback** → LED/buzzer confirmation, LCD display update

### Real-time Pairing Flow
1. **Admin initiates pairing** → Create pairing session in Firestore
2. **ESP32 monitors** → Listen for active pairing sessions
3. **RFID detection** → Hardware captures card code and updates session
4. **App confirmation** → Complete pairing and update student record

## Hardware Specifications

### Required Components
- **ESP32 Development Board** (WiFi enabled)
- **MFRC522 RFID Reader** with cards/tags
- **TCS3200 Color Sensor** for currency recognition
- **16x2 LCD Display** with I2C interface
- **3 Push Buttons** (Up, Down, OK navigation)
- **LEDs, Buzzer, Servo Motor, Relay** for feedback

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
- **Hardware requirement**: Complete ESP32 setup with all sensors
- **Network setup**: WiFi credentials configured via LCD menu
- **Firebase connection**: Real-time database for hardware communication
- **Calibration**: Color sensor requires calibration for accurate currency detection

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
- **Real-time listeners**: Efficient Firestore listener management
- **Memory optimization**: Proper cleanup of subscriptions
- **Background sync**: Minimal background processing for better battery life
- **Caching**: Strategic caching of frequently accessed data