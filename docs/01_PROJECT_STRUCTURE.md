# SMART BISYAROH - PROJECT STRUCTURE & DATABASE SCHEMA

**Smart Bisyaroh** - Comprehensive IoT-enabled payment management system untuk TPQ (Taman Pendidikan Quran) Ibadurrohman. Sistem ini menggabungkan React Native mobile application dengan ESP32 IoT hardware untuk menyediakan automated RFID-based student identification, intelligent payment processing dengan machine learning, dan real-time financial management khusus untuk Islamic religious schools.

```
   +=============================================================================+
                        🏫 SMART BISYAROH SYSTEM                            |
                                                                           |
   |  📱 React Native App  <->  ☁️  Firebase  <->  🔌 ESP32  <->  🏫 TPQ School   |
                                                                           |
   |     Payment Mgmt      |    Real-time DB    |   RFID     |   Student    |
   |     Timeline Ctrl     |    Firestore       |   KNN ML   |   Payments   |
   |     Multi-Role        |    Authentication  |   Solenoid |   Credits    |
   +=============================================================================+
```

---

# 📋 TABLE OF CONTENTS

- [1.1 Application Architecture](#11-application-architecture)
- [1.2 Technology Stack](#12-technology-stack)
- [1.3 Navigation Structure](#13-navigation-structure)
- [1.4 Service Layer Organization](#14-service-layer-organization)
- [1.5 Database Schema](#15-database-schema)
- [1.6 Complete Project File Structure](#16-complete-project-file-structure)
- [1.7 UI Interface Design & Mockups](#17-ui-interface-design-mockups)

---

## 1.1 Application Architecture

### **Multi-Role System Architecture**
Smart Bisyaroh menggunakan sophisticated multi-role architecture dengan complete role-based access control untuk admin dan user (wali/parent). System ini designed khusus untuk Islamic educational institutions dengan comprehensive payment management capabilities.

```
  ----------------------------------------------------------------------------+
                        SMART BISYAROH ARCHITECTURE                        |
  ----------------------------------------------------------------------------+
                                                                          |
|    ----------------+      ----------------+      ----------------+        |
|  |  📱 MOBILE APP   |    |  ☁️  FIREBASE    |    |  🔌 ESP32 HW     |        |
                                     |        |
|  | • React Native  |<-->| • Realtime DB   |<-->| • RFID Reader   |        |
|  | • Expo SDK 53   |    | • Firestore     |    | • KNN Algorithm |        |
|  | • Multi-Role    |    | • Authentication|    | • Color Sensor  |        |
|  | • Payment Mgmt  |    | • Cloud Storage |    | • Solenoid Ctrl |        |
|  | • Timeline Sys  |    |                 |    | • LCD Display   |        |
|    ----------------+      ----------------+      ----------------+        |
                                                                          |
|    --------------------------------------------------------------------+   |
|                   CORE FEATURES                                          |
|  |  👥 Multi-Role Access      💰 Timeline Payments                    |  |
|  |  🏷️ RFID Integration       🧠 KNN Currency Recognition             |  |
|  |  💳 Credit Management      🔒 Solenoid Access Control              |  |
|  |  📊 Real-time Analytics    ⚡ Mode-Based Architecture              |  |
|    --------------------------------------------------------------------+   |
  ----------------------------------------------------------------------------+
```

### **Key Architectural Principles**
- **Role-Based Access Control**: Admin vs User (Wali) dengan secured route protection
- **Revolutionary Mode-Based Communication**: Ultra-simple ESP32 integration dengan 90% code reduction
- **Data Bridge Pattern**: RTDB untuk real-time coordination, Firestore untuk persistent storage
- **Timeline-Based Payment System**: Flexible payment schedules dengan holiday management
- **Service Layer Separation**: Business logic terpisah dari UI components
- **Context-based State Management**: Global state via React Context

## 1.2 Technology Stack

### **Frontend (React Native)**
```
  ----------------------------------------------------------------------------+
                         TECHNOLOGY STACK                                 |
  ----------------------------------------------------------------------------+
                                                                          |
|  📱 FRONTEND                    ☁️  BACKEND                  🔌 HARDWARE     |
|    ----------------+             ----------------+           ------------+  |
|  | React Native 0.79.3       | Firebase              | ESP32 Arduino  |  |
|  |                   | • Realtime DB         | • Dual Core    |  |
|  | Expo SDK 53             | • Firestore           | • RTOS         |  |
|  | React 19.0.0            | • Authentication      | • WiFi         |  |
|  | Expo Router 5.1.0       | • Cloud Storage       | • RFID Reader  |  |
|  |                         |                       | • Color Sensor |  |
|  | Libraries:              | Development:          | Components:    |  |
|  | • React Native SVG      | • Firebase Admin      | • MFRC522 RFID |  |
|  | • Chart Kit (Charts)    | • Interactive CLI     | • TCS3200      |  |
|  | • DateTimePicker        | • Testing Framework   | • 16x2 LCD     |  |
|  | • AsyncStorage          | • File System API     | • Solenoid     |  |
|    ----------------+             ----------------+           ------------+  |
  ----------------------------------------------------------------------------+
```

### **Core Dependencies**
```json
{
  "react-native": "0.79.3",
  "expo": "53.0.11",
  "firebase": "^10.14.0",
  "expo-router": "~5.1.0",
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "15.11.2",
  "@react-native-async-storage/async-storage": "2.1.2",
  "@react-native-community/datetimepicker": "8.3.0",
  "expo-file-system": "~18.1.10",
  "expo-sharing": "~13.1.5",
  "jspdf": "^2.5.1",
  "xlsx": "^0.18.5"
}
```

### **Development & Testing Tools**
```
  ----------------------------------------------------------------------------+
                      DEVELOPMENT ECOSYSTEM                               |
  ----------------------------------------------------------------------------+
|  🧪 TESTING TOOLS               🛠️  UTILITIES                  📊 ANALYTICS    |
|    ----------------+             ----------------+           ------------+  |
|  | ESP32 Simulator         | Firebase Cleanup      | Export Tools   |  |
|  | • Interactive CLI       | • Database Reset      | • CSV Export   |  |
|  | • Hardware Simulation   | • User Management     | • PDF Reports  |  |
|  | • RFID Testing          | • Activity Cleanup    | • Charts       |  |
|  |                         |                       |                |  |
|  | Payment Testing         | Mode-Based Testing    | Role Testing   |  |
|  | • Timeline Creation     | • RFID Pairing       | • Admin Panel  |  |
|  | • Credit Processing     | • Payment Processing  | • User Access  |  |
|  | • Status Calculation    | • Solenoid Control    | • Route Guard  |  |
|    ----------------+             ----------------+           ------------+  |
  ----------------------------------------------------------------------------+
```

## 1.3 Navigation Structure

### **File-based Navigation (Expo Router)**
```
  ----------------------------------------------------------------------------+
                          NAVIGATION ARCHITECTURE                          |
  ----------------------------------------------------------------------------+
                                                                          |
|  🧭 EXPO ROUTER STRUCTURE                                                 |
                                                                          |
|    app/                                                                   |
|      ├── _layout.jsx              ← Root layout dengan providers          |
|      ├── index.jsx                ← Root redirect logic                  |
|      ├── role-selection.jsx       ← Admin/User role selection            |
|      ├── (auth)/                  ← Authentication group                 |
|      │   ├── _layout.jsx          ← Auth layout wrapper                  |
|      │   ├── admin-login.jsx      ← Admin login screen                   |
|      │   ├── admin-register.jsx   ← Admin registration                   |
|      │   └── wali-login.jsx       ← Parent/User login                    |
|      ├── (tabs)/                  ← User (Wali) interface group          |
|      │   ├── _layout.jsx          ← Tab navigation setup                 |
|      │   ├── index.jsx            ← User dashboard (payments)            |
|      │   ├── profile.jsx          ← User profile management              |
|      │   ├── edit-profile.jsx     ← Profile editing                      |
|      │   └── logout.jsx           ← Logout confirmation                  |
|      └── (admin)/                 ← Admin panel group                     |
|          ├── _layout.jsx          ← Admin layout wrapper                 |
|          ├── index.jsx            ← Admin dashboard                      |
|          ├── daftar-santri.jsx    ← Student list management              |
|          ├── tambah-santri.jsx    ← Add new student                      |
|          ├── edit-santri.jsx      ← Edit student details                 |
|          ├── detail-santri.jsx    ← Student detail view                  |
|          ├── timeline-manager.jsx ← Payment timeline management          |
|          ├── create-timeline.jsx  ← Create new payment schedule          |
|          ├── payment-manager.jsx  ← Payment processing interface         |
|          ├── payment-status.jsx   ← Payment status overview              |
|          └── user-payment-detail.jsx ← Individual payment details        |
                                                                          |
|  🔒 ROUTE PROTECTION                                                      |
|    AuthGuard.jsx → Protects authenticated routes                         |
|    Route Groups: (auth) public, (tabs) user, (admin) admin-only          |
  ----------------------------------------------------------------------------+
```

### **Multi-Role Navigation System**
```
  ----------------------------------------------------------------------------+
                           MULTI-ROLE NAVIGATION                           |
  ----------------------------------------------------------------------------+
                                                                          |
|  👥 USER (WALI) INTERFACE       🏫 ADMIN INTERFACE                         |
|    ----------------+             ----------------+                        |
|  | • Payment Dashboard      | • Complete Management      |                |
|  | • Child payment status   | • Student CRUD operations |                |
|  | • Credit balance view    | • Payment timeline control|                |
|  | • Profile management     | • RFID pairing interface  |                |
|  | • Payment history        | • Financial reporting     |                |
|    ----------------+             ----------------+                        |
                                                                          |
|  🔐 AUTHENTICATION FLOWS        ⚡ REAL-TIME FEATURES                     |
|    ----------------+             ----------------+                        |
|  | • Role-based login       | • Live payment updates    |                |
|  | • Separate login screens | • Real-time RFID pairing  |                |
|  | • Auto role detection    | • Instant status changes  |                |
|  | • Secure route guards    | • Live admin notifications|                |
|    ----------------+             ----------------+                        |
  ----------------------------------------------------------------------------+
```

## 1.4 Service Layer Organization

### **Core Business Services**
```
  ----------------------------------------------------------------------------+
                        SERVICE LAYER ARCHITECTURE                        |
  ----------------------------------------------------------------------------+
                                                                          |
|  💼 CORE SERVICES                                                         |
|    ----------------+                                                      |
|  | authService.js           ← Authentication operations                   |
|  | • login, register, logout                                             |
|  | • role-based authentication                                           |
|  | • session management                                                  |
|  |                                                                       |
|  | userService.js           ← User/Student management                     |
|  | • profile CRUD operations                                             |
|  | • student management                                                  |
|  | • RFID card assignment                                                |
|  |                                                                       |
|  | firebase.js              ← Firebase configuration                     |
|  | • database initialization                                             |
|  | • realtime DB setup                                                   |
|  | • authentication config                                               |
|    ----------------+                                                      |
                                                                          |
|  💰 PAYMENT SERVICES                                                      |
|    ----------------+                                                      |
|  | timelineService.js       ← Payment timeline management                |
|  | • Timeline creation & management                                      |
|  | • Period calculation dengan holiday support                           |
|  | • Auto-generation payment schedules                                   |
|  |                                                                       |
|  | adminPaymentService.js   ← Admin payment operations                   |
|  | • Payment processing workflows                                        |
|  | • Timeline management dari admin side                                 |
|  | • Financial reporting dan analytics                                   |
|  |                                                                       |
|  | waliPaymentService.js    ← User/Parent payment operations             |
|  | • Payment processing untuk wali                                       |
|  | • Credit management dan overpayment handling                          |
|  | • Payment history dan status tracking                                 |
|  |                                                                       |
|  | paymentStatusManager.js  ← Payment status calculation                 |
|  | • Real-time status updates                                            |
|  | • Late payment detection                                              |
|  | • Status synchronization across all payment records                   |
|    ----------------+                                                      |
  ----------------------------------------------------------------------------+
```

### **Revolutionary Hardware Services**
```javascript
// rtdbModeService.js - Mode-based ESP32 communication
const rtdbModeService = {
  // Revolutionary ultra-simple mode system
  modes: {
    idle: 'idle',           // Default state
    pairing: 'pairing',     // RFID card pairing mode
    payment: 'payment',     // Payment processing mode
    solenoid: 'solenoid'    // Solenoid control mode
  },
  
  // Mode priority system (prevents race conditions)
  priorities: { idle: 0, solenoid: 1, pairing: 2, payment: 3 },
  
  // Ultra-simple mode operations
  setMode: async (mode) => await set(ref(rtdb, 'mode'), mode),
  getMode: async () => await get(ref(rtdb, 'mode')),
  resetToIdle: async () => await setMode('idle', true)
};

// dataBridgeService.js - RTDB to Firestore synchronization
const dataBridgeService = {
  // Bridge successful RFID pairings
  bridgeRFIDPairing: async (santriId, rfidCode),
  
  // Bridge successful payments
  bridgePaymentData: async (paymentData),
  
  // Data lifecycle management
  cleanupRTDBData: async () => /* Self-cleaning patterns */
};

// pairingService.js - RFID card management
const pairingService = {
  // Real-time RFID pairing dengan timeout
  startPairing: async (santriId, timeoutMs = 30000),
  cancelPairing: async (),
  
  // Auto-cleanup dan timeout management
  setupPairingTimeout: (santriId, timeoutMs)
};
```

### **Utility Services**
```javascript
// dateUtils.js - Indonesian date formatting
const dateUtils = {
  formatIndonesian: (date) => date.toLocaleDateString('id-ID'),
  formatTime: (date) => date.toLocaleTimeString('id-ID'),
  calculatePaymentPeriods: (startDate, duration, type, holidays)
};

// validation.js - Form validation helpers
const validation = {
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePhone: (phone) => /^08[0-9]{8,11}$/.test(phone),
  validatePaymentAmount: (amount) => amount > 0 && amount <= 1000000
};

// paymentStatusUtils.js - Payment calculation logic
const paymentStatusUtils = {
  calculatePaymentStatus: (paidAmount, requiredAmount, dueDate),
  determineLateFees: (dueDate, currentDate),
  processOverpayment: (paidAmount, requiredAmount)
};
```

## 1.5 Database Schema

### **Firebase Firestore Collections**

#### **Collection: `users`**
```javascript
{
  id: string,              // User UID
  email: string,           // User email
  role: 'admin' | 'user',  // Role-based access control
  deleted: boolean,        // Soft delete flag
  
  // Admin users
  nama: string,            // Admin name
  noHp: string,            // Admin phone number
  
  // Student/parent users
  namaSantri: string,      // Student name
  namaWali: string,        // Parent/guardian name
  noHpWali: string,        // Parent phone number
  rfidSantri: string,      // RFID card code (nullable)
  creditBalance: number,   // Current credit balance
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **Collection: `active_timeline`**
```javascript
{
  id: string,              // Timeline ID
  name: string,            // Timeline name/description
  type: 'daily' | 'weekly' | 'monthly' | 'yearly',
  duration: number,        // Number of periods
  baseAmount: number,      // Base payment amount per period
  totalAmount: number,     // Total amount for entire timeline
  amountPerPeriod: number, // Calculated amount per period
  startDate: string,       // ISO date string
  mode: 'auto' | 'manual', // Timeline calculation mode
  simulationDate: string,  // Optional simulation date
  holidays: number[],      // Array of holiday dates (day numbers)
  
  // Generated periods
  periods: {
    [periodKey]: {
      number: number,        // Period sequence number
      label: string,         // Human-readable period label
      dueDate: string,       // ISO date string
      active: boolean,       // Whether period is active
      amount: number,        // Amount for this period
      isHoliday: boolean    // Whether this period is a holiday
    }
  },
  
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **Collection: `payments/{timelineId}/periods/{periodKey}/santri_payments/{santriId}`**
```javascript
{
  userId: string,          // Reference to user document
  amount: number,          // Required payment amount
  paidAmount: number,      // Amount actually paid
  status: 'belum_bayar' | 'lunas' | 'terlambat',
  paidAt: timestamp,       // When payment was made (nullable)
  creditUsed: number,      // Amount paid using credit balance
  overpayment: number,     // Amount overpaid (added to credit)
  
  // Payment processing metadata
  paymentMethod: 'cash' | 'credit' | 'mixed',
  processedBy: string,     // Admin/system who processed
  rfidUsed: string,        // RFID card used for payment
  hardwarePayment: boolean, // Whether paid via ESP32 hardware
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **Collection: `rfid_pairing`**
```javascript
{
  santriId: string,        // Student ID being paired
  rfidCode: string,        // Detected RFID code
  isActive: boolean,       // Whether pairing session is active
  startTime: string,       // When pairing started
  status: 'waiting' | 'received' | 'cancelled' | 'completed',
  
  // Completion details
  receivedTime: string,    // When RFID was detected
  cancelledTime: string,   // When pairing was cancelled
  completedBy: string,     // Admin who completed pairing
  
  createdAt: timestamp
}
```

### **Firebase Realtime Database Structure**
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
  
  "solenoid_command": "locked",
  
  "app_settings": {
    "current_timeline_id": "string",
    "system_status": "active|maintenance",
    "last_hardware_sync": "timestamp"
  }
}
```

## 1.6 Complete Project File Structure

```
025-008-Haikal/

📱 MOBILE APPLICATION (React Native + Expo)
├── app/                                    # 🧭 Expo Router Navigation
│   ├── index.jsx                          # Root redirect logic
│   ├── _layout.jsx                        # Main app layout with providers
│   ├── role-selection.jsx                 # Admin/User role selection
│   ├── (auth)/                            # Authentication screens
│   │   ├── _layout.jsx                    # Auth layout wrapper
│   │   ├── admin-login.jsx                # Admin login interface
│   │   ├── admin-register.jsx             # Admin registration
│   │   └── wali-login.jsx                 # Parent/User login interface
│   ├── (tabs)/                            # User (Wali) interface
│   │   ├── _layout.jsx                    # Tab navigation setup
│   │   ├── index.jsx                      # User dashboard (payments)
│   │   ├── profile.jsx                    # User profile management
│   │   ├── edit-profile.jsx               # Profile editing screen
│   │   └── logout.jsx                     # Logout confirmation
│   └── (admin)/                           # Admin panel interface
│       ├── _layout.jsx                    # Admin layout wrapper
│       ├── index.jsx                      # Admin dashboard with controls
│       ├── daftar-santri.jsx              # Student list management
│       ├── tambah-santri.jsx              # Add new student form
│       ├── edit-santri.jsx                # Edit student details
│       ├── detail-santri.jsx              # Student detail view
│       ├── timeline-manager.jsx           # Payment timeline management
│       ├── create-timeline.jsx            # Create new payment schedule
│       ├── payment-manager.jsx            # Payment processing interface
│       ├── payment-status.jsx             # Payment status overview
│       └── user-payment-detail.jsx        # Individual payment details

├── components/                             # 🧩 Reusable UI Components
│   ├── AuthGuard.jsx                      # Route protection component
│   ├── ErrorBoundary.jsx                  # Global error handling
│   ├── auth/
│   │   └── AuthForm.jsx                   # Reusable authentication form
│   ├── illustrations/                     # SVG illustration components
│   │   ├── index.js                       # Export index
│   │   ├── LoginIllustration.jsx          # Login screen illustration
│   │   ├── RegisterIllustration.jsx       # Register screen illustration
│   │   └── ForgotPasswordIllustration.jsx # Password recovery illustration
│   └── ui/                                # Core UI components
│       ├── Button.jsx                     # Themed button component
│       ├── Input.jsx                      # Custom text input with validation
│       ├── LoadingSpinner.jsx             # Loading states with ActivityIndicator
│       ├── DataTable.jsx                  # Data display table component
│       ├── DatePicker.jsx                 # Date selection component
│       ├── TimelinePicker.jsx             # Timeline selection component
│       ├── PaymentModal.jsx               # Payment processing modal
│       ├── CreditBalance.jsx              # Credit balance display
│       ├── ToastNotification.jsx          # Toast notification component
│       └── IllustrationContainer.jsx      # SVG illustration wrapper

├── contexts/                               # 🌐 Global State Management
│   ├── AuthContext.jsx                    # User authentication & role management
│   ├── SettingsContext.jsx                # App settings dengan Firebase sync
│   ├── NotificationContext.jsx            # Toast notifications & alerts
│   └── ThemeContext.jsx                   # Theme management

├── services/                               # 💼 Business Logic Layer
│   ├── firebase.js                        # Firebase initialization & config
│   ├── authService.js                     # Authentication operations
│   ├── userService.js                     # User/Student management
│   ├── timelineService.js                 # 💰 Payment timeline management
│   ├── adminPaymentService.js             # Admin payment operations
│   ├── waliPaymentService.js              # User/Parent payment operations
│   ├── paymentStatusManager.js            # Payment status calculation
│   ├── rtdbModeService.js                 # 🚀 Revolutionary mode-based hardware comm
│   ├── dataBridgeService.js               # Data synchronization RTDB↔Firestore
│   ├── pairingService.js                  # RFID card pairing management
│   ├── seederService.js                   # Development data seeding
│   ├── hardwarePaymentService.js          # ⚠️ DEPRECATED - Hardware payment legacy
│   └── solenoidControlService.js          # ⚠️ DEPRECATED - Solenoid control legacy

├── utils/                                  # 🛠️ Utility Functions
│   ├── dateUtils.js                       # Date formatting & manipulation
│   ├── validation.js                      # Form validation helpers
│   └── paymentStatusUtils.js              # Payment calculation logic

├── constants/                              # 📐 App Constants
│   └── Colors.js                          # Color scheme & theme definitions

├── assets/                                 # 🖼️ Static Assets
│   ├── icon.png                           # Main app icon
│   ├── icon-tpq.png                       # TPQ school icon
│   ├── icon-money.png                     # Money/payment icon
│   ├── splash.png                         # Splash screen
│   ├── adaptive-icon.png                  # Android adaptive icon
│   ├── favicon.png                        # Web favicon
│   └── images/                            # App images & illustrations
│       ├── app-icon.png                   # Application icon
│       ├── login.png                      # Login screen image
│       ├── register.png                   # Registration screen image
│       ├── forgot-password.png            # Password recovery image
│       └── splash.png                     # Splash screen image

├── types/                                  # 📝 Type Definitions
│   └── svg.d.ts                           # SVG TypeScript declarations

├── 🔌 ESP32 FIRMWARE (Arduino C++)
├── firmware/                              # ESP32 hardware firmware
│   ├── HaikalFirmwareR1/                  # Latest firmware version (R1)
│   │   ├── HaikalFirmwareR1.ino          # Main Arduino sketch
│   │   ├── Header.h                       # Global definitions & configuration
│   │   ├── KNN.ino                        # K-NN currency recognition algorithm
│   │   ├── WiFi.ino                       # WiFi connectivity & Firebase integration
│   │   ├── Menu.ino                       # LCD menu system & navigation
│   │   └── USBComs.ino                    # Serial communication & debugging
│   ├── HaikalFirmwareR0/                  # Previous firmware version (R0)
│   │   ├── HaikalFirmwareR0.ino          # Legacy main sketch
│   │   ├── Header.h                       # Legacy configuration
│   │   ├── KNN.ino                        # Legacy KNN implementation
│   │   ├── Menu.ino                       # Legacy menu system
│   │   ├── USBComs.ino                    # Legacy USB communication
│   │   └── WiFi.ino                       # Legacy WiFi integration
│   ├── Testing/                           # Hardware component tests
│   │   ├── TestLCD16x2/                   # LCD display testing
│   │   ├── TestRFID/                      # RFID reader testing
│   │   ├── TestRTC_DS3231/                # Real-time clock testing
│   │   ├── TestRelay/                     # Relay control testing
│   │   ├── TestServo180/                  # Servo motor testing
│   │   └── TestTCS3200/                   # Color sensor testing
│   ├── TestNTPClient/                     # NTP time synchronization testing
│   ├── TestNTPDatetimeV2/                 # Enhanced NTP datetime testing
│   ├── README.md                          # Firmware documentation
│   └── haikal-90821-firebase-adminsdk-fbsvc-7192969a9b.json # Firebase admin key

├── 🧪 TESTING & DEVELOPMENT TOOLS
├── testing/
│   ├── esp32-simulator.js                 # Interactive ESP32 hardware simulator
│   └── esp32-framework.cpp                # C++ testing framework
├── firebase-cleanup/
│   ├── cleanup.js                         # Interactive database cleanup tool
│   ├── serviceAccountKey.json             # Firebase admin service account
│   └── .gitignore                         # Cleanup tool gitignore

├── 📚 DOCUMENTATION
├── docs/                                  # 📋 PROJECT DOCUMENTATION
│   ├── README.md                          # Documentation index
│   ├── 01_PROJECT_STRUCTURE.md            # This file - Architecture overview
│   ├── 02_SYSTEM_FLOWS.md                 # System flows & data processing
│   └── 03_VERSION_HISTORY.md              # Version history & changelog
├── README.md                              # Main project documentation
├── CLAUDE.md                              # Claude Code development guide
├── SYSTEM_FLOWS.md                        # Legacy system documentation
├── AUTHENTICATION_TROUBLESHOOTING.md     # Auth troubleshooting guide
├── BUILD_APK.md                           # APK build instructions
├── SETUPGUIDE.md                          # Setup and installation guide
├── ESP32_MODE_BASED_IMPLEMENTATION.md    # ESP32 mode architecture guide
└── DEPRECATED_SERVICES.md                # Deprecated services documentation

└── 📋 Configuration Files
    ├── package.json                           # Dependencies & scripts
    ├── app.json                               # Expo configuration
    ├── eas.json                               # EAS Build configuration
    ├── metro.config.js                        # Metro bundler configuration
    ├── .env.example                           # Environment variables example
    └── node_modules/                          # Installed dependencies
```

## 1.7 UI Interface Design & Mockups

### **Design System & Theme**
```
  ----------------------------------------------------------------------------+
                            DESIGN SYSTEM                                  |
  ----------------------------------------------------------------------------+
                                                                          |
|  🎨 COLOR SCHEME (TPQ Theme)                                              |
|    ----------------+                                                      |
|  | Primary: #F50057      ← Pink A400 untuk buttons & highlights          |
|  | Secondary: #2E7D32    ← Green 800 untuk success states               |
|  | Success: #4CAF50      ← Green 500 untuk success states               |
|  | Warning: #FF9800      ← Orange 500 untuk warning states              |
|  | Danger: #F44336       ← Red 500 untuk danger states                  |
|  | Background: #FAFAFA   ← Grey 50 untuk light theme                    |
|  | Surface: #FFFFFF      ← White untuk cards & surfaces                 |
|  | Text: #212121         ← Grey 900 untuk primary text                  |
|    ----------------+                                                      |
                                                                          |
|  📱 RESPONSIVE LAYOUT                                                     |
|    ----------------+                                                      |
|  | Mobile-First Design   ← Optimized untuk mobile screens               |
|  | Adaptive Typography   ← Scalable text sizes                          |
|  | Touch-Friendly UI     ← 44px minimum touch targets                   |
|  | Indonesian Locale     ← Complete Indonesian language support         |
|  | Islamic Theme         ← TPQ-appropriate design elements              |
|    ----------------+                                                      |
  ----------------------------------------------------------------------------+
```

### **Screen Layout Mockups**

#### **Admin Dashboard (Admin Panel)**
```
┌─────────────────────────────────────────────┐
│  🏫 Smart Bisyaroh - Admin Panel           │
├─────────────────────────────────────────────┤
│  👥 Santri: 25  💰 Lunas: 20  ⏰ Telat: 5   │
├─────────────────────────────────────────────┤
│  📊 Quick Actions                          │
│  ┌─────────────┐   ┌─────────────┐        │
│  │  👥 Santri  │   │ 💰 Timeline │        │
│  │   Manager   │   │   Manager   │        │
│  └─────────────┘   └─────────────┘        │
│  ┌─────────────┐   ┌─────────────┐        │
│  │ 🏷️ RFID     │   │ 🔒 Solenoid │        │
│  │  Pairing    │   │  Control    │        │
│  └─────────────┘   └─────────────┘        │
├─────────────────────────────────────────────┤
│  ⚡ Mode: IDLE • Hardware: Online         │
└─────────────────────────────────────────────┘
```

#### **User Dashboard (Parent Interface)**
```
┌─────────────────────────────────────────────┐
│  📚 Smart Bisyaroh - Dashboard Wali        │
├─────────────────────────────────────────────┤
│  👤 Ahmad Fadhil                           │
│  💳 Saldo: Rp 15.000 • 🏷️ RFID: Terpasang  │
├─────────────────────────────────────────────┤
│  📅 Status Pembayaran                      │
│  ┌─────────────────────────────────────────┐│
│  │ Periode: Minggu 1 (Jan 2025)           ││
│  │ Status: 🟢 LUNAS                       ││
│  │ Dibayar: Rp 5.000 / Rp 5.000          ││
│  │ Tanggal: 15 Jan 2025, 08:30           ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  [📊 Riwayat] [⚙️ Profile] [🚪 Logout]     │
└─────────────────────────────────────────────┘
```

#### **Payment Timeline Manager (Admin)**
```
┌─────────────────────────────────────────────┐
│  💰 Timeline Manager                       │
├─────────────────────────────────────────────┤
│  📅 Timeline Aktif: "Pembayaran Januari"   │
│  Periode: Mingguan • Total: 4 Minggu      │
│  Jumlah: Rp 5.000/minggu                  │
├─────────────────────────────────────────────┤
│  📊 Statistik Pembayaran                   │
│  ┌─────────────────────────────────────────┐│
│  │ Minggu 1: 20/25 santri ✅             ││
│  │ Minggu 2: 18/25 santri ⏰             ││
│  │ Minggu 3: 15/25 santri ⏰             ││
│  │ Minggu 4: 0/25 santri ⏰              ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  [➕ Buat Timeline] [📊 Detail] [⚙️ Edit]   │
└─────────────────────────────────────────────┘
```

#### **RFID Pairing Interface (Admin)**
```
┌─────────────────────────────────────────────┐
│  🏷️ RFID Card Pairing                      │
├─────────────────────────────────────────────┤
│  👤 Pilih Santri:                          │
│  [ Ahmad Fadhil ▼ ]                        │
├─────────────────────────────────────────────┤
│  🏷️ Status Pairing                         │
│  ┌─────────────────────────────────────────┐│
│  │ ⏳ Menunggu kartu RFID...               ││
│  │                                         ││
│  │ 📱 Dekatkan kartu ke ESP32              ││
│  │ ⏰ Timeout: 30 detik                    ││
│  │                                         ││
│  │ [❌ Batalkan]                           ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  ⚡ Hardware Status: Online • Mode: Pairing │
└─────────────────────────────────────────────┘
```

### **Visual Hierarchy & Components**

#### **Payment Status Indicators**
```
🟢 LUNAS (Paid)        - Green backgrounds, checkmark icons
🟡 SEBAGIAN (Partial)  - Yellow backgrounds, partial icons  
🔴 BELUM (Unpaid)      - Red backgrounds, alert icons
⏰ TERLAMBAT (Late)    - Orange backgrounds, clock icons
💳 KREDIT (Credit)     - Blue backgrounds, credit icons
```

#### **Role-Based Theming**
```
👥 USER THEME (Wali)   - Soft colors, family-friendly icons
🏫 ADMIN THEME         - Professional colors, management icons
🎨 TPQ BRANDING        - Islamic green & pink school colors
```

#### **Interactive Elements**
```
🔴 Primary buttons     - Pink theme dengan rounded corners
⚪ Secondary buttons   - Outlined style
📱 Touch feedback      - Haptic feedback pada interactions
🔄 Pull-to-refresh     - Standard iOS/Android patterns
💫 Loading states      - Elegant loading animations
```

---

**📋 Next Documents:**
- **[02_SYSTEM_FLOWS.md](./02_SYSTEM_FLOWS.md)** - System flows dan data processing
- **[03_VERSION_HISTORY.md](./03_VERSION_HISTORY.md)** - Version history dan changelog