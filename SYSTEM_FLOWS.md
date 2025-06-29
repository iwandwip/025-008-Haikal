# Smart Bisyaroh System Flows Documentation

## Overview

This document details the critical flows in the Smart Bisyaroh payment management system:
1. **RFID Pairing Flow** - Associating RFID cards with students
2. **Payment Processing Flow** - RFID-based payment with currency detection
3. **Hardware Payment Flow** - App-initiated payment through ESP32 device
4. **Solenoid Control Flow** - Remote lock/unlock control for payment device

All flows integrate the React Native mobile app with ESP32 IoT hardware through Firebase.

---

# RFID Pairing Flow

## Overview

The RFID pairing system enables administrators to associate RFID cards with students (santri). This is a prerequisite for the payment system, as students are identified via their RFID cards.

## System Architecture

### Components
- **Mobile App**: React Native admin interface
- **ESP32 Hardware**: RFID reader (MFRC522) and LCD display
- **Firebase Firestore**: Central database for pairing sessions
- **Communication**: Real-time sync via Firestore listeners

### Important Note
Currently, the mobile app and ESP32 use **different Firebase projects**:
- Mobile App: `haikal-ef006`
- ESP32: `haikal-90821`

This must be unified for production deployment.

## RFID Pairing Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Firebase      │    │   ESP32         │    │   RFID Card     │
│   (Admin)       │    │   Firestore     │    │   Hardware      │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          │ 1. Start Pairing     │                      │                      │
          ├─────────────────────▶│                      │                      │
          │    (santriId)        │                      │                      │
          │                      │                      │                      │
          │ 2. Create Session    │                      │                      │
          │   {isActive: true,   │                      │                      │
          │    status: waiting}  │                      │                      │
          │                      │                      │                      │
          │                      │ 3. ESP32 Monitors    │                      │
          │                      │    Firestore         │                      │
          │                      ├─────────────────────▶│                      │
          │                      │    (polling)         │                      │
          │                      │                      │                      │
          │                      │                      │ 4. Display LCD       │
          │                      │                      │   "Tap RFID"         │
          │                      │                      │                      │
          │                      │                      │ 5. Scan RFID ◄──────┤
          │                      │                      │                      │
          │                      │ 6. Update Session    │                      │
          │                      │ ◄────────────────────┤                      │
          │                      │   {rfidCode: "xxx",  │                      │
          │                      │    status: received} │                      │
          │                      │                      │                      │
          │ 7. Listen & Update   │                      │                      │
          │ ◄────────────────────┤                      │                      │
          │                      │                      │                      │
          │ 8. Update User       │                      │                      │
          │    Profile RFID      │                      │                      │
          ├─────────────────────▶│                      │                      │
          │                      │                      │                      │
          │ 9. Cancel Session    │                      │                      │
          ├─────────────────────▶│                      │                      │
          │                      │                      │                      │
          │ 10. Success Alert    │                      │ 11. LCD Confirm      │
          │     "RFID Paired!"   │                      │    "RFID Paired!"    │
```

**Timeline**: Total process ~5-30 seconds (with 30s timeout)

## Detailed Pairing Flow

### 1. Initiation Phase (Mobile App)

**Location**: `app/(admin)/detail-santri.jsx`

When an admin wants to pair an RFID card with a student:

```javascript
const handleStartPairing = async () => {
  const result = await startPairing(santriId);
  if (result.success) {
    Alert.alert(
      "Pairing Dimulai",
      "Silakan tap kartu RFID pada device ESP32. Pairing akan otomatis berhenti dalam 30 detik."
    );
  }
};
```

### 2. Pairing Session Creation

**Location**: `services/pairingService.js`

The pairing service creates a session in Firestore:

```javascript
// Firestore document structure
const PAIRING_COLLECTION = 'rfid_pairing';
const PAIRING_DOC_ID = 'current_session';

const pairingData = {
  isActive: true,
  santriId: santriId,
  startTime: new Date().toISOString(),
  rfidCode: '',          // Empty, waiting for ESP32
  status: 'waiting',     // Status: waiting → received
  cancelledTime: '',
  receivedTime: ''
};
```

### 3. ESP32 Monitoring & RFID Scanning

**Current Implementation** (via USB Serial):
```cpp
// firmware/HaikalFirmwareR1/USBComs.ino
if (dataHeader == "RFID_USER") {  // Format: RFID_USER#04a2bc1f294e80
  uuidRFID = dataValue;
}
```

**Production Implementation** (with RFID hardware):
```cpp
// Check for active pairing session
void checkPairingSession() {
  if (firestore->getDocument("rfid_pairing/current_session")) {
    JsonDocument doc = firestore->getDocument();
    if (doc["isActive"] == true && doc["status"] == "waiting") {
      currentPairingActive = true;
      enableRFIDScanning();
    }
  }
}

// Update Firestore when RFID detected
void updatePairingSession(String rfidCode) {
  JsonDocument updateDoc;
  updateDoc["rfidCode"] = rfidCode;
  updateDoc["status"] = "received";
  updateDoc["receivedTime"] = dateTimeNTP.getISO8601Time();
  
  firestore->updateDocument("rfid_pairing/current_session", updateDoc);
}
```

### 4. Mobile App Listener & Completion

**Location**: `services/pairingService.js`

```javascript
export const listenToPairingData = (callback) => {
  const unsubscribe = onSnapshot(docRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      
      // Check if RFID code received
      if (data.rfidCode && data.rfidCode !== '' && data.santriId) {
        // Update santri's RFID in user profile
        const result = await updateSantriRFID(data.santriId, data.rfidCode);
        
        if (result.success) {
          await cancelPairing();
          callback({ success: true, rfidCode: data.rfidCode });
        }
      }
    }
  });
  
  return unsubscribe;
};
```

### 5. Data Storage

The RFID is permanently stored in the user profile:

```javascript
// services/userService.js
export const updateSantriRFID = async (santriId, rfidCode) => {
  const santriRef = doc(db, 'users', santriId);
  await updateDoc(santriRef, {
    rfidSantri: rfidCode,
    updatedAt: new Date()
  });
};
```

## Pairing Error Handling

- **30-second timeout**: Automatic session cancellation
- **Single active session**: Prevents concurrent pairing attempts
- **Network failures**: 2-second polling mechanism
- **Duplicate RFID**: Validation against existing assignments
- **Manual cancellation**: User can cancel anytime

---

# Payment Processing Flow

## Overview

The payment system integrates RFID identification, physical currency detection via machine learning, and real-time payment recording. Students tap their RFID card and insert cash bills for automatic payment processing.

## Payment System Architecture

### Components
- **ESP32 Hardware**: RFID reader, TCS3200 color sensor, LCD display
- **Machine Learning**: KNN algorithm for currency recognition
- **Firebase**: Firestore for payment records, Realtime Database for live sync
- **Mobile App**: Payment management and status tracking

### Payment Methods
1. **Physical Cash via ESP32**: RFID + Currency detection
2. **Digital Payment via App**: Bank transfer, e-wallets
3. **Credit System**: Overpayment handling and balance management

## Payment Processing Flow Diagram

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Student       │  │   ESP32         │  │   Firebase      │  │   Mobile App    │  │   Currency      │
│   (Santri)      │  │   Hardware      │  │   Database      │  │   Service       │  │   (Cash Bill)   │
└─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘
          │                    │                    │                    │                    │
          │ 1. Select "Bayar"  │                    │                    │                    │
          ├───────────────────▶│                    │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 2. Display LCD     │                    │                    │
          │                    │   "Tap RFID"       │                    │                    │
          │                    │                    │                    │                    │
          │ 3. Tap RFID Card   │                    │                    │                    │
          ├───────────────────▶│                    │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 4. Validate RFID   │                    │                    │
          │                    ├───────────────────▶│                    │                    │
          │                    │   Query users      │                    │                    │
          │                    │   WHERE rfidSantri │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 5. User Found ✓    │                    │                    │
          │                    │ ◄──────────────────┤                    │                    │
          │                    │                    │                    │                    │
          │                    │ 6. Display LCD     │                    │                    │
          │                    │   "Masukkan Uang"  │                    │                    │
          │                    │                    │                    │                    │
          │ 7. Insert Cash     │                    │                    │                    │
          │    Bill           │                    │                    │                    │
          ├───────────────────▶│ ◄──────────────────┼────────────────────┼────────────────────┤
          │                    │                    │                    │                    │
          │                    │ 8. TCS3200 Sensor  │                    │                    │
          │                    │    Read RGB Values │                    │                    │
          │                    │    R: 140, G: 80   │                    │                    │
          │                    │    B: 180          │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 9. KNN Algorithm   │                    │                    │
          │                    │    Predict: 10000  │                    │                    │
          │                    │    IDR (Purple)    │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 10. Get Timeline   │                    │                    │
          │                    ├───────────────────▶│                    │                    │
          │                    │    & Payment Status│                    │                    │
          │                    │                    │                    │                    │
          │                    │ 11. Payment Info   │                    │                    │
          │                    │ ◄──────────────────┤                    │                    │
          │                    │    Required: 5000  │                    │                    │
          │                    │    Paid: 0         │                    │                    │
          │                    │                    │                    │                    │
          │                    │ 12. Process Payment│                    │                    │
          │                    ├───────────────────▶│                    │                    │
          │                    │    Amount: 10000   │                    │                    │
          │                    │    User: santri123 │                    │                    │
          │                    │                    │                    │                    │
          │                    │                    │ 13. Payment Service│                    │
          │                    │                    ├───────────────────▶│                    │
          │                    │                    │    Process with    │                    │
          │                    │                    │    Credit System   │                    │
          │                    │                    │                    │                    │
          │                    │                    │ 14. Update Records │                    │
          │                    │                    │ ◄──────────────────┤                    │
          │                    │                    │    Status: lunas   │                    │
          │                    │                    │    Credit: +5000   │                    │
          │                    │                    │                    │                    │
          │                    │ 15. Success Response│                   │                    │
          │                    │ ◄──────────────────┤                    │                    │
          │                    │                    │                    │                    │
          │                    │ 16. Hardware        │                    │                    │
          │                    │     Feedback        │                    │                    │
          │                    │     - LCD: "Lunas!" │                    │                    │
          │                    │     - LED Green     │                    │                    │
          │                    │     - Buzzer Beep   │                    │                    │
          │                    │     - Servo Open    │                    │                    │
          │                    │                    │                    │                    │
          │ 17. Take Receipt   │                    │                    │ 18. Push Notification│
          │     (if enabled)   │                    │                    │    "Payment Success" │
          │ ◄──────────────────┤                    │                    ├───────────────────▶│
          │                    │                    │                    │    to Parent App    │
```

**Timeline**: Total process ~10-60 seconds (including currency detection)

## Currency Recognition Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cash Bill     │────▶│   TCS3200       │────▶│   KNN Algorithm │
│   (IDR)         │     │   Color Sensor  │     │   Classifier    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   RGB Values    │     │   Prediction    │
                        │   R: 140        │     │   Result        │
                        │   G: 80         │     │                 │
                        │   B: 180        │     │   10000 IDR     │
                        └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Training Data │     │   Confidence    │
                        │   Comparison    │     │   Score         │
                        │                 │     │                 │
                        │   2000 IDR: 0.9 │     │   95% Accurate  │
                        │   5000 IDR: 0.3 │     │                 │
                        │   10000 IDR: 0.1│     │                 │
                        └─────────────────┘     └─────────────────┘
```

## Credit System Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Payment       │     │   Current       │     │   Credit        │
│   Amount        │     │   Credit        │     │   Calculation   │
│   10000 IDR     │     │   Balance       │     │                 │
└─────────┬───────┘     └─────────┬───────┘     └─────────┬───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Required      │     │   Credit        │     │   New Credit    │
│   Amount        │     │   Applied       │     │   Balance       │
│   5000 IDR      │     │   0 IDR         │     │                 │
└─────────┬───────┘     └─────────┬───────┘     └─────────┬───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Overpayment   │     │   Max Credit    │     │   Final         │
│   5000 IDR      │     │   Limit         │     │   Credit        │
│                 │     │   15000 IDR     │     │   5000 IDR      │
│                 │     │   (3x amount)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Detailed Payment Flow

### 1. Payment Initiation on ESP32

**Location**: `firmware/HaikalFirmwareR1/Menu.ino`

User selects "Bayar" (Pay) from main menu:

```cpp
// Display RFID request
if (menuName == "bayar" && state == 0) {
  auto menuBayar = menu.createMenu(2, " Silakan Tap ", "  RFID Anda  ");
  menu.showMenu(menuBayar, true);
  
  // Wait for RFID
  if (!uuidRFID.isEmpty()) {
    checkRFIDUserState = 1;  // Trigger validation
  }
}
```

### 2. RFID Validation

ESP32 validates RFID against registered users:

```cpp
// Query Firestore for user with this RFID
void validateRFIDUser(String rfidCode) {
  String query = "rfidSantri == " + rfidCode + " && role == 'user'";
  JsonDocument result = firestore->query("users", query);
  
  if (result["documents"].size() > 0) {
    validUserId = result["documents"][0]["name"];
    isRFIDUserValid = true;
    proceedToPayment();
  } else {
    displayError("RFID Tidak Terdaftar");
  }
}
```

### 3. Currency Detection Process

**Location**: `firmware/HaikalFirmwareR1/KNN.ino`

#### KNN Training Data
```cpp
// Indonesian Rupiah RGB signatures
TrainingData dataset[] = {
  // 2000 IDR (Grayish)
  {115, 115, 115, 2000},
  {130, 130, 130, 2000},
  
  // 5000 IDR (Reddish-brown)
  {200, 120, 50, 5000},
  {190, 110, 45, 5000},
  
  // 10000 IDR (Purple/Blue)
  {140, 80, 180, 10000},
  {150, 90, 170, 10000}
};
```

#### Currency Recognition
```cpp
int predictKNN(int r, int g, int b, int k = 5) {
  // Calculate distances to all training samples
  float distances[DATASET_SIZE];
  
  for (int i = 0; i < DATASET_SIZE; i++) {
    distances[i] = euclideanDistance(r, g, b,
      dataset[i].r, dataset[i].g, dataset[i].b);
  }
  
  // Find k nearest neighbors and vote
  return getMostFrequentLabel(findKNearest(distances, k));
}
```

### 4. Payment Processing (Mobile App)

**Location**: `services/waliPaymentService.js`

#### Credit System Implementation
```javascript
export const processPaymentWithCredit = async (
  userId, timelineId, periodKey, paymentAmount, paymentMethod
) => {
  // Get user's credit balance
  const userDoc = await getDoc(doc(db, 'users', userId));
  const currentCredit = userDoc.data().creditBalance || 0;
  
  // Apply credit first
  let creditUsed = Math.min(currentCredit, paymentAmount);
  let remainingAmount = paymentAmount - creditUsed;
  
  // Handle overpayment (max 3x period amount)
  if (remainingAmount > targetAmount) {
    const overpayment = remainingAmount - targetAmount;
    const maxCredit = targetAmount * 3;
    
    const newCredit = Math.min(
      currentCredit - creditUsed + overpayment, 
      maxCredit
    );
    
    await updateDoc(doc(db, 'users', userId), {
      creditBalance: newCredit
    });
  }
  
  // Save payment record
  const paymentData = {
    paidAmount: paymentAmount,
    creditUsed: creditUsed,
    status: 'lunas',
    paidAt: new Date(),
    paymentMethod: paymentMethod
  };
  
  await updateDoc(paymentRef, paymentData);
};
```

### 5. Real-time Status Updates

**Location**: `services/paymentStatusManager.js`

```javascript
class PaymentStatusManager {
  async updatePaymentStatuses(userId, forceUpdate = false) {
    // Check throttle (5 minutes)
    if (!forceUpdate && this.isThrottled(userId)) return;
    
    // Get active timeline
    const timeline = await this.getActiveTimeline();
    
    // Process each period
    for (const [periodKey, period] of Object.entries(timeline.periods)) {
      // Check if payment is late
      const now = new Date();
      const dueDate = new Date(period.dueDate);
      
      if (now > dueDate && paymentStatus === 'belum_bayar') {
        await this.updatePaymentStatus(userId, periodKey, 'terlambat');
      }
    }
    
    // Notify listeners
    this.notifyListeners(userId);
  }
}
```

### 6. Payment Confirmation

**ESP32 Hardware Feedback**:
```cpp
void confirmPayment(int amount) {
  // LCD display
  lcd.clear();
  lcd.print("Pembayaran OK!");
  lcd.setCursor(0, 1);
  lcd.print("Rp " + String(amount));
  
  // Audio/Visual feedback
  buzzSuccess();
  digitalWrite(LED_GREEN, HIGH);
  
  // Servo action (gate/drawer)
  servo.write(90);
  delay(3000);
  servo.write(0);
}
```

**Mobile App Notification**:
```javascript
// Real-time payment listener
onSnapshot(paymentDoc, (doc) => {
  if (doc.exists() && doc.data().status === 'lunas') {
    showNotification({
      type: 'success',
      message: 'Pembayaran berhasil diterima!',
      duration: 5000
    });
  }
});
```

## Payment Status Types

- `belum_bayar` - Not yet paid
- `lunas` - Fully paid
- `terlambat` - Late payment

## System Architecture Overview

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                 Smart Bisyaroh System                       │
                    └─────────────────────────────────────────────────────────────┘
                                                    │
                ┌───────────────────────────────────┼───────────────────────────────────┐
                │                                   │                                   │
                ▼                                   ▼                                   ▼
    ┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
    │    Mobile App       │           │     Firebase        │           │   ESP32 Hardware    │
    │   (React Native)    │           │   (Cloud Backend)   │           │   (IoT Device)      │
    └─────────────────────┘           └─────────────────────┘           └─────────────────────┘
              │                                   │                                   │
              │                                   │                                   │
    ┌─────────┴─────────┐               ┌─────────┴─────────┐               ┌─────────┴─────────┐
    │   Admin Panel     │               │   Firestore       │               │   RFID Reader     │
    │   • Student Mgmt  │               │   • Users         │               │   (MFRC522)       │
    │   • Timeline      │               │   • Payments      │               │                   │
    │   • RFID Pairing  │               │   • Timelines     │               │   Color Sensor    │
    │                   │               │   • Pairing       │               │   (TCS3200)       │
    │   Parent Panel    │               │                   │               │                   │
    │   • Payment View  │               │   Realtime DB     │               │   LCD Display     │
    │   • Profile       │               │   • Live Sync     │               │   (16x2 I2C)      │
    │   • Credit        │               │   • Hardware      │               │                   │
    └───────────────────┘               └───────────────────┘               │   Controls        │
                                                                            │   • 3 Buttons     │
                                                                            │   • LEDs          │
                                                                            │   • Buzzer        │
                                                                            │   • Servo         │
                                                                            └───────────────────┘
```

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Actions  │────▶│   Data Layer    │────▶│   Hardware      │
│                 │     │                 │     │   Actions       │
│ • Admin Login   │     │ • Authentication│     │ • LCD Display   │
│ • Student Mgmt  │     │ • User Service  │     │ • RFID Scan     │
│ • RFID Pairing  │     │ • Payment Svc   │     │ • Currency Read │
│ • Payment View  │     │ • Timeline Svc  │     │ • Feedback      │
│ • Profile Edit  │     │ • Pairing Svc   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile UI     │     │   Firebase      │     │   ESP32         │
│   Components    │     │   Collections   │     │   Firmware      │
│                 │     │                 │     │                 │
│ • AuthForm      │     │ • users/        │     │ • Main Loop     │
│ • DataTable     │     │ • payments/     │     │ • WiFi Manager  │
│ • PaymentModal  │     │ • timelines/    │     │ • Sensor Mgmt   │
│ • TimelinePicker│     │ • rfid_pairing/ │     │ • KNN Algorithm │
│ • Button/Input  │     │                 │     │ • Menu System   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Error Handling Flow

```
                    ┌─────────────────────────────────────┐
                    │            Error Occurs             │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │         Error Classification         │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Network       │     │   Hardware      │     │   Validation    │
│   Errors        │     │   Errors        │     │   Errors        │
│                 │     │                 │     │                 │
│ • WiFi Lost     │     │ • RFID Failed   │     │ • Invalid RFID  │
│ • Firebase Down │     │ • Sensor Error  │     │ • Wrong Amount  │
│ • Timeout       │     │ • LCD Issue     │     │ • Duplicate     │
└─────────┬───────┘     └─────────┬───────┘     └─────────┬───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Retry Logic   │     │   Fallback      │     │   User Message  │
│                 │     │   Mechanism     │     │                 │
│ • Exponential   │     │ • Manual Input  │     │ • Clear Error   │
│   Backoff       │     │ • Offline Queue │     │ • Retry Option  │
│ • Max Attempts  │     │ • Skip Sensor   │     │ • Help Guide    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Error Handling

### RFID Pairing Errors
- **No active session**: Check Firebase configuration
- **RFID not detected**: Verify hardware connections
- **Timeout**: 30-second automatic cancellation
- **Duplicate RFID**: Database validation

### Payment Processing Errors
- **Invalid RFID**: Display "RFID Tidak Valid"
- **Insufficient amount**: Show remaining balance
- **Network failure**: Offline queue with sync
- **Sensor error**: Manual input fallback

## Security Considerations

1. **Authentication**: Admin-only pairing, user-only payments
2. **Validation**: Amount limits, duplicate prevention
3. **Encryption**: HTTPS for all communications
4. **Audit trail**: Complete payment logging
5. **Access control**: Firestore security rules

## Testing & Simulation

### ESP32 Simulator
```javascript
// testing/esp32-simulator.js
// Simulates RFID scanning and payment processing
setTimeout(() => {
  const rfidCode = generateRandomRFID();
  updatePairingInFirestore(rfidCode);
}, Math.random() * 2000 + 1000);
```

### Manual Testing
1. **RFID Pairing**: Admin → Student Detail → Pair RFID → Tap Card
2. **Payment**: Select Bayar → Tap RFID → Insert Money → Confirm

## Production Deployment

### Mobile App Checklist
- [ ] Configure production Firebase
- [ ] Set up payment gateways
- [ ] Enable push notifications
- [ ] Add analytics tracking

### ESP32 Firmware Checklist
- [ ] Enable RFID hardware module
- [ ] Calibrate color sensor
- [ ] Configure WiFi credentials
- [ ] Set production Firebase

### Firebase Checklist
- [ ] Unify Firebase projects
- [ ] Configure security rules
- [ ] Set up backup strategy
- [ ] Monitor usage quotas

## Hardware Wiring Diagram

```
                            ESP32 Development Board
                         ┌─────────────────────────────┐
                         │                             │
        RFID MFRC522     │  RST_PIN (22)    SS_PIN (21)│
           ┌─────────────┤                             │
           │ RST ────────┤                             │
           │ SDA ────────┤                             │
           │ MOSI ───────┤   MOSI (23)                 │
           │ MISO ───────┤   MISO (19)                 │
           │ SCK ────────┤   SCK (18)                  │
           │ VCC ────────┤   3.3V                      │
           │ GND ────────┤   GND                       │
           └─────────────┤                             │
                         │                             │
      TCS3200 Color      │                             │
        Sensor           │   S0 (4)    S1 (16)        │
           ┌─────────────┤   S2 (17)   S3 (5)          │
           │ S0 ─────────┤   OUT (18)                  │
           │ S1 ─────────┤                             │
           │ S2 ─────────┤                             │
           │ S3 ─────────┤                             │
           │ OUT ────────┤                             │
           │ VCC ────────┤   5V                        │
           │ GND ────────┤   GND                       │
           └─────────────┤                             │
                         │                             │
      16x2 LCD I2C       │                             │
           ┌─────────────┤   SDA (13)  SCL (14)        │
           │ SDA ────────┤                             │
           │ SCL ────────┤                             │
           │ VCC ────────┤   5V                        │
           │ GND ────────┤   GND                       │
           └─────────────┤                             │
                         │                             │
      Control Buttons    │                             │
           ┌─────────────┤   UP (25)   DOWN (26)       │
           │ UP ─────────┤   OK (27)                   │
           │ DOWN ───────┤                             │
           │ OK ─────────┤                             │
           └─────────────┤                             │
                         │                             │
      Output Devices     │                             │
           ┌─────────────┤   LED_GREEN (2)             │
           │ LED ────────┤   LED_RED (15)              │
           │ BUZZER ─────┤   BUZZER (12)               │
           │ SERVO ──────┤   SERVO (32)                │
           │ RELAY ──────┤   RELAY (33)                │
           └─────────────┤                             │
                         └─────────────────────────────┘
```

## Firebase Collections Structure

```
Smart Bisyaroh Firebase Database
├── 📁 users/
│   ├── 📄 {userId}/
│   │   ├── email: "parent@example.com"
│   │   ├── role: "user" | "admin"
│   │   ├── namaSantri: "Ahmad Fauzan"
│   │   ├── namaWali: "Budi Santoso"
│   │   ├── rfidSantri: "04a2bc1f294e80"
│   │   ├── creditBalance: 15000
│   │   ├── createdAt: Date
│   │   └── updatedAt: Date
│   └── ...
│
├── 📁 active_timeline/
│   └── 📄 {timelineId}/
│       ├── name: "Timeline Bulanan 2024"
│       ├── type: "monthly"
│       ├── duration: 12
│       ├── baseAmount: 50000
│       ├── amountPerPeriod: 4167
│       ├── startDate: "2024-01-01"
│       ├── periods: {
│       │   "2024-01": {
│       │     number: 1,
│       │     label: "Januari 2024",
│       │     dueDate: "2024-01-31",
│       │     active: true,
│       │     amount: 4167,
│       │     isHoliday: false
│       │   }
│       └── }
│
├── 📁 payments/
│   └── 📄 {timelineId}/
│       └── 📁 periods/
│           └── 📄 {periodKey}/
│               └── 📁 santri_payments/
│                   └── 📄 {santriId}/
│                       ├── userId: "santri123"
│                       ├── amount: 4167
│                       ├── paidAmount: 4167
│                       ├── status: "lunas"
│                       ├── creditUsed: 0
│                       ├── overpayment: 0
│                       ├── paidAt: Date
│                       ├── paymentMethod: "cash_rfid"
│                       └── paymentProof: null
│
└── 📁 rfid_pairing/
    └── 📄 current_session/
        ├── isActive: true
        ├── santriId: "santri123"
        ├── startTime: "2024-01-15T10:30:00Z"
        ├── rfidCode: ""
        ├── status: "waiting"
        ├── cancelledTime: ""
        └── receivedTime: ""
```

## State Management Flow

```
                    ┌─────────────────────────────────────┐
                    │         App Launch/Login            │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │       Initialize Contexts           │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AuthContext   │     │ SettingsContext │     │NotificationCtx  │
│                 │     │                 │     │                 │
│ • User Info     │     │ • Theme         │     │ • Toast Queue   │
│ • Role          │     │ • Language      │     │ • Alert System │
│ • Auth State    │     │ • Preferences   │     │ • Push Notifs   │
│ • Token         │     │                 │     │                 │
└─────────┬───────┘     └─────────┬───────┘     └─────────┬───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Role-based      │     │ UI Adaptation   │     │ Real-time       │
│ Navigation      │     │                 │     │ Updates         │
│                 │     │ • Dark/Light    │     │                 │
│ Admin: (admin)/ │     │ • Indonesian    │     │ • Payment       │
│ User: (tabs)/   │     │ • Font Size     │     │ • Status        │
│                 │     │                 │     │ • Notifications │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Hardware Configuration

### Pin Connections
```cpp
// RFID Reader (MFRC522)
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

// Buttons
#define BUTTON_UP 25
#define BUTTON_DOWN 26
#define BUTTON_OK 27
```

---

# Hardware Payment Flow

## Overview

The hardware payment flow enables users to initiate payment from the mobile app and then complete it at the ESP32 device. This requires app confirmation before hardware activation to ensure authorized payments.

## Hardware Payment Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Firebase      │    │   ESP32         │    │   RFID Card     │    │   Currency      │
│   (Parent)      │    │   Firestore     │    │   Hardware      │    │                 │    │   (Cash Bill)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │                      │
          │ 1. Tap "Bayar dari   │                      │                      │                      │
          │    Alat Bisyaroh"    │                      │                      │                      │
          │                      │                      │                      │                      │
          │ 2. Show Instruction  │                      │                      │                      │
          │    Alert Dialog      │                      │                      │                      │
          │                      │                      │                      │                      │
          │ 3. Create Session    │                      │                      │                      │
          ├─────────────────────▶│                      │                      │                      │
          │   {userId, amount,   │                      │                      │                      │
          │    status: waiting,  │                      │                      │                      │
          │    expiryTime: +5m}  │                      │                      │                      │
          │                      │                      │                      │                      │
          │                      │ 4. ESP32 Monitors    │                      │                      │
          │                      │    Payment Sessions  │                      │                      │
          │                      ├─────────────────────▶│                      │                      │
          │                      │    (polling)         │                      │                      │
          │                      │                      │                      │                      │
          │ 5. App Shows Status  │                      │ 6. LCD Shows         │                      │
          │   "Menunggu di Alat  │                      │   "Pembayaran Aktif" │                      │
          │    Bisyaroh"         │                      │   "Tap RFID Anda"    │                      │
          │                      │                      │                      │                      │
          │                      │                      │ 7. Validate RFID ◄──┤                      │
          │                      │                      │    Match with        │                      │
          │                      │                      │    session userId    │                      │
          │                      │                      │                      │                      │
          │                      │ 8. Update Session    │                      │                      │
          │                      │ ◄────────────────────┤                      │                      │
          │                      │   {status:           │                      │                      │
          │                      │    rfid_detected}    │                      │                      │
          │                      │                      │                      │                      │
          │ 9. App Shows         │                      │ 10. LCD Shows        │                      │
          │   "RFID Terdeteksi,  │                      │    "Masukkan Uang"   │                      │
          │    Masukkan Uang"    │                      │    "Sesuai Nominal"  │                      │
          │                      │                      │                      │                      │
          │                      │                      │ 11. Currency         │                      │
          │                      │                      │     Detection ◄──────┼──────────────────────┤
          │                      │                      │     (TCS3200 + KNN)  │                      │
          │                      │                      │                      │                      │
          │                      │ 12. Complete Payment │                      │                      │
          │                      │ ◄────────────────────┤                      │                      │
          │                      │    {status:          │                      │                      │
          │                      │     completed,       │                      │                      │
          │                      │     detectedAmount}  │                      │                      │
          │                      │                      │                      │                      │
          │ 13. Success Alert    │                      │ 14. Hardware         │                      │
          │    "Pembayaran       │                      │     Feedback         │                      │
          │     Berhasil!"       │                      │     - LCD: "Lunas!"  │                      │
          │                      │                      │     - LED Green      │                      │
          │                      │                      │     - Buzzer Beep    │                      │
          │                      │                      │     - Servo Action   │                      │
```

**Timeline**: Total process ~2-8 minutes (5-minute session timeout)

## Hardware Payment Session Management

### 1. Session Creation (Mobile App)

**Location**: `components/ui/PaymentModal.jsx`

```javascript
const handleHardwarePayment = async () => {
  setHardwarePayment(true);
  setHardwareStatus('waiting');
  
  Alert.alert(
    "Bayar dari Alat Bisyaroh 🤖",
    "Silakan pergi ke alat pembayaran Bisyaroh dan:\n\n1. Tap kartu RFID Anda\n2. Masukkan uang sesuai nominal\n3. Tunggu konfirmasi pembayaran\n\nSesi ini akan aktif selama 5 menit.",
    [
      {
        text: "Batal",
        style: "cancel",
        onPress: () => {
          setHardwarePayment(false);
          setHardwareStatus('waiting');
        }
      },
      {
        text: "Mulai",
        onPress: async () => {
          await startHardwarePaymentSession();
        }
      }
    ]
  );
};
```

### 2. Session Data Structure

**Location**: `services/hardwarePaymentService.js`

```javascript
// Firestore Collection: hardware_payment_sessions
const sessionData = {
  id: `${userId}_${Date.now()}`,
  userId: userId,
  timelineId: timelineId,
  periodKey: periodKey,
  amount: amount,
  status: 'waiting', // waiting, rfid_detected, processing, completed, failed, expired
  isActive: true,
  startTime: new Date().toISOString(),
  expiryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
  rfidCode: '',
  detectedAmount: 0,
  completedAt: null,
  errorMessage: '',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### 3. ESP32 Session Monitoring

**Expected Implementation** (ESP32 firmware):

```cpp
// Monitor active payment sessions
void checkHardwarePaymentSessions() {
  if (firestore->queryDocuments("hardware_payment_sessions", 
      "isActive == true && status == 'waiting'")) {
    
    JsonDocument sessions = firestore->getQueryResult();
    
    for (auto& session : sessions["documents"].as<JsonArray>()) {
      String sessionId = session["name"];
      String userId = session["fields"]["userId"]["stringValue"];
      int amount = session["fields"]["amount"]["integerValue"];
      
      // Display payment request on LCD
      displayPaymentRequest(userId, amount);
      
      currentPaymentSession = sessionId;
      paymentSessionActive = true;
      break; // Handle one session at a time
    }
  }
}

// Handle RFID validation for payment session
void validateSessionRFID(String rfidCode) {
  if (!paymentSessionActive) return;
  
  // Get session data
  JsonDocument session = firestore->getDocument(
    "hardware_payment_sessions/" + currentPaymentSession
  );
  
  String sessionUserId = session["fields"]["userId"]["stringValue"];
  
  // Validate RFID matches session user
  if (validateUserRFID(rfidCode, sessionUserId)) {
    // Update session status
    JsonDocument updateDoc;
    updateDoc["status"] = "rfid_detected";
    updateDoc["rfidCode"] = rfidCode;
    updateDoc["updatedAt"] = dateTimeNTP.getISO8601Time();
    
    firestore->updateDocument(
      "hardware_payment_sessions/" + currentPaymentSession, 
      updateDoc
    );
    
    // Proceed to currency detection
    enableCurrencyDetection();
    lcd.print("Masukkan Uang");
  } else {
    displayError("RFID Tidak Sesuai");
  }
}
```

### 4. Real-time Status Updates

**Location**: `components/ui/PaymentModal.jsx`

```javascript
const handleHardwareSessionUpdate = (sessionData) => {
  if (!sessionData) {
    setHardwareStatus('error');
    return;
  }

  switch (sessionData.status) {
    case 'waiting':
      setHardwareStatus('scanning');
      break;
    case 'rfid_detected':
      setHardwareStatus('processing');
      break;
    case 'processing':
      setHardwareStatus('processing');
      break;
    case 'completed':
      setHardwareStatus('success');
      if (hardwareListener) {
        hardwareListener();
        setHardwareListener(null);
      }
      Alert.alert(
        "Pembayaran Berhasil! 🎉",
        `Pembayaran ${payment.periodData?.label} melalui alat Bisyaroh berhasil diproses.\n\nJumlah: ${formatCurrency(sessionData.detectedAmount || amountAfterCredit)}`,
        [
          {
            text: "OK",
            onPress: () => {
              setHardwarePayment(false);
              setHardwareStatus('waiting');
              setHardwareSessionId(null);
              onPaymentSuccess(payment, 'hardware_cash', sessionData.detectedAmount || amountAfterCredit);
              onClose();
            }
          }
        ]
      );
      break;
    case 'failed':
    case 'expired':
      setHardwareStatus('error');
      if (hardwareListener) {
        hardwareListener();
        setHardwareListener(null);
      }
      Alert.alert(
        "Pembayaran Gagal",
        sessionData.errorMessage || "Sesi pembayaran telah berakhir atau gagal",
        [
          {
            text: "OK",
            onPress: () => {
              setHardwarePayment(false);
              setHardwareStatus('waiting');
              setHardwareSessionId(null);
            }
          }
        ]
      );
      break;
  }
};
```

### 5. Session Expiry Management

**Location**: `services/hardwarePaymentService.js`

```javascript
export const listenToHardwarePaymentSession = (sessionId, callback) => {
  const sessionRef = doc(db, HARDWARE_PAYMENT_COLLECTION, sessionId);
  
  const unsubscribe = onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      const sessionData = doc.data();
      
      // Check if session expired
      const now = new Date();
      const expiryTime = new Date(sessionData.expiryTime);
      
      if (now > expiryTime && sessionData.status !== 'completed') {
        updateHardwarePaymentSession(sessionId, { 
          status: 'expired', 
          isActive: false,
          errorMessage: 'Sesi pembayaran telah berakhir' 
        });
        callback({ ...sessionData, status: 'expired' });
        return;
      }
      
      callback(sessionData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to hardware payment session:', error);
    callback(null);
  });

  return unsubscribe;
};
```

---

# Solenoid Control Flow

## Overview

The solenoid control system allows administrators to remotely lock/unlock the physical payment device. This is essential for device security and maintenance access.

## Solenoid Control Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin App     │    │   Firebase      │    │   ESP32         │    │   Solenoid      │
│   Dashboard     │    │   Firestore     │    │   Hardware      │    │   Lock/Motor    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          │ 1. Admin Tap         │                      │                      │
          │   "Buka Alat"        │                      │                      │
          │                      │                      │                      │
          │ 2. Select Duration   │                      │                      │
          │   • 30 detik         │                      │                      │
          │   • 1 menit          │                      │                      │
          │   • 5 menit          │                      │                      │
          │   • Emergency        │                      │                      │
          │                      │                      │                      │
          │ 3. Send Command      │                      │                      │
          ├─────────────────────▶│                      │                      │
          │   {command: unlock,  │                      │                      │
          │    duration: 30,     │                      │                      │
          │    adminId: admin,   │                      │                      │
          │    timestamp: now}   │                      │                      │
          │                      │                      │                      │
          │                      │ 4. ESP32 Monitors    │                      │
          │                      │    Commands          │                      │
          │                      ├─────────────────────▶│                      │
          │                      │    (polling every    │                      │
          │                      │     2 seconds)       │                      │
          │                      │                      │                      │
          │ 5. Show Loading      │                      │ 6. Process Command   │
          │   "Mengirim Perintah │                      │   Validate & Execute │                      │
          │    ke ESP32..."      │                      │                      │                      │
          │                      │                      │                      │                      │
          │                      │ 7. Update Status     │                      │ 8. Unlock Solenoid  │
          │                      │ ◄────────────────────┤                      ├─────────────────────▶│
          │                      │   {status: executed, │                      │   digitalWrite(HIGH) │
          │                      │    executedAt: now,  │                      │                      │
          │                      │    deviceResponse}   │                      │                      │
          │                      │                      │                      │                      │
          │                      │ 8. Update Device     │                      │ 9. LCD Shows         │
          │                      │    Status            │                      │   "Alat Terbuka"     │
          │                      │ ◄────────────────────┤                      │   "Tutup Otomatis    │
          │                      │   {solenoidStatus:   │                      │    dalam 30s"        │
          │                      │    unlocked,         │                      │                      │
          │                      │    lastUpdate: now}  │                      │                      │
          │                      │                      │                      │                      │
          │ 9. Success Toast     │                      │ 10. Start Timer      │ 11. Auto Lock        │
          │   "Perintah buka     │                      │     for Auto Lock    │     After Duration   │
          │    alat terkirim"    │                      │     (30 seconds)     ├─────────────────────▶│
          │                      │                      │                      │   digitalWrite(LOW)  │
          │                      │                      │                      │                      │
          │ 10. Real-time        │                      │ 12. Update Status    │                      │
          │     Status Update    │                      │     to Locked        │                      │
          │     Battery: 85%     │                      ├─────────────────────▶│                      │
          │     Status: Unlocked │                      │                      │                      │
          │     Online: ✅       │                      │                      │                      │
```

**Timeline**: Command execution ~2-5 seconds, Auto-lock after specified duration

## Solenoid Control Implementation

### 1. Admin Control Panel

**Location**: `app/(admin)/index.jsx`

```javascript
const handleUnlockWithDuration = () => {
  Alert.alert(
    "Buka Alat Pembayaran",
    "Pilih durasi untuk membuka alat:",
    [
      { text: "Batal", style: "cancel" },
      { text: "30 detik", onPress: () => handleUnlockSolenoid(30) },
      { text: "1 menit", onPress: () => handleUnlockSolenoid(60) },
      { text: "5 menit", onPress: () => handleUnlockSolenoid(300) },
      { text: "Emergency", style: "destructive", onPress: handleEmergencyUnlock }
    ]
  );
};

const handleUnlockSolenoid = async (duration = 30) => {
  setSolenoidLoading(true);
  
  try {
    const result = await unlockSolenoid(duration);
    
    if (result.success) {
      showGeneralNotification(
        "Perintah Terkirim",
        `Perintah buka alat (${duration}s) telah dikirim ke ESP32`,
        "success",
        { duration: 3000 }
      );
    } else {
      showGeneralNotification(
        "Gagal Mengirim Perintah",
        result.error || "Gagal mengirim perintah buka alat",
        "error"
      );
    }
  } catch (error) {
    showGeneralNotification(
      "Error",
      "Terjadi kesalahan saat mengirim perintah",
      "error"
    );
  } finally {
    setSolenoidLoading(false);
  }
};
```

### 2. Solenoid Command Structure

**Location**: `services/solenoidControlService.js`

```javascript
// Firestore Collection: solenoid_control
export const unlockSolenoid = async (duration = 30) => {
  try {
    const commandData = {
      command: 'unlock',
      duration: duration, // Duration in seconds
      timestamp: new Date().toISOString(),
      status: 'pending', // pending, executed, failed
      adminId: 'admin', // Could be dynamic based on current admin
      deviceResponse: '',
      executedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const commandRef = doc(db, SOLENOID_CONTROL_COLLECTION, `unlock_${Date.now()}`);
    await setDoc(commandRef, commandData);

    return { success: true, commandId: commandRef.id };
  } catch (error) {
    console.error('Error sending unlock command:', error);
    return { success: false, error: error.message };
  }
};

export const lockSolenoid = async () => {
  try {
    const commandData = {
      command: 'lock',
      timestamp: new Date().toISOString(),
      status: 'pending',
      adminId: 'admin',
      deviceResponse: '',
      executedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const commandRef = doc(db, SOLENOID_CONTROL_COLLECTION, `lock_${Date.now()}`);
    await setDoc(commandRef, commandData);

    return { success: true, commandId: commandRef.id };
  } catch (error) {
    console.error('Error sending lock command:', error);
    return { success: false, error: error.message };
  }
};
```

### 3. ESP32 Command Processing

**Expected Implementation** (ESP32 firmware):

```cpp
// Monitor solenoid commands
void checkSolenoidCommands() {
  if (firestore->queryDocuments("solenoid_control", 
      "status == 'pending' && ORDER BY timestamp DESC LIMIT 1")) {
    
    JsonDocument commands = firestore->getQueryResult();
    
    if (commands["documents"].size() > 0) {
      auto command = commands["documents"][0];
      String commandId = command["name"];
      String commandType = command["fields"]["command"]["stringValue"];
      int duration = command["fields"]["duration"]["integerValue"];
      
      if (commandType == "unlock") {
        executeSolenoidUnlock(duration, commandId);
      } else if (commandType == "lock") {
        executeSolenoidLock(commandId);
      } else if (commandType == "emergency_unlock") {
        executeEmergencyUnlock(commandId);
      }
    }
  }
}

void executeSolenoidUnlock(int duration, String commandId) {
  // Activate solenoid (unlock)
  digitalWrite(SOLENOID_PIN, HIGH);
  currentSolenoidStatus = "unlocked";
  
  // Update command status
  JsonDocument updateDoc;
  updateDoc["status"] = "executed";
  updateDoc["executedAt"] = dateTimeNTP.getISO8601Time();
  updateDoc["deviceResponse"] = "Solenoid unlocked for " + String(duration) + " seconds";
  
  firestore->updateDocument("solenoid_control/" + commandId, updateDoc);
  
  // Update device status
  updateSolenoidDeviceStatus();
  
  // LCD feedback
  lcd.clear();
  lcd.print("Alat Terbuka");
  lcd.setCursor(0, 1);
  lcd.print("Tutup: " + String(duration) + "s");
  
  // Schedule auto-lock
  scheduleSolenoidLock(duration * 1000); // Convert to milliseconds
}

void executeSolenoidLock(String commandId) {
  // Deactivate solenoid (lock)
  digitalWrite(SOLENOID_PIN, LOW);
  currentSolenoidStatus = "locked";
  
  // Update command status
  JsonDocument updateDoc;
  updateDoc["status"] = "executed";
  updateDoc["executedAt"] = dateTimeNTP.getISO8601Time();
  updateDoc["deviceResponse"] = "Solenoid locked";
  
  firestore->updateDocument("solenoid_control/" + commandId, updateDoc);
  
  // Update device status
  updateSolenoidDeviceStatus();
  
  // LCD feedback
  lcd.clear();
  lcd.print("Alat Terkunci");
  lcd.setCursor(0, 1);
  lcd.print("Remote Command");
}
```

### 4. Real-time Status Monitoring

**Location**: `app/(admin)/index.jsx`

```javascript
const [solenoidStatus, setSolenoidStatus] = useState({
  status: 'unknown', // locked, unlocked, unknown
  deviceOnline: false,
  lastUpdate: null,
  batteryLevel: 0
});

useEffect(() => {
  loadSolenoidStatus();
  
  // Listen to real-time solenoid status
  const unsubscribe = listenToSolenoidStatus((statusData) => {
    setSolenoidStatus(statusData);
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);

// UI Display
<View style={styles.solenoidStatusRow}>
  <View style={[
    styles.statusIndicator,
    { 
      backgroundColor: solenoidStatus.deviceOnline 
        ? colors.success 
        : colors.error 
    }
  ]} />
  <Text style={[styles.statusText, { color: colors.gray600 }]}>
    {solenoidStatus.deviceOnline ? 'Online' : 'Offline'} • 
    Status: {solenoidStatus.status === 'locked' ? 'Terkunci' : 
             solenoidStatus.status === 'unlocked' ? 'Terbuka' : 'Unknown'}
  </Text>
</View>

<View style={[styles.batteryIndicator, { borderColor: colors.gray300 }]}>
  <View 
    style={[
      styles.batteryFill,
      { 
        width: `${solenoidStatus.batteryLevel}%`,
        backgroundColor: solenoidStatus.batteryLevel > 50 
          ? colors.success 
          : solenoidStatus.batteryLevel > 20 
          ? colors.warning 
          : colors.error
      }
    ]} 
  />
  <Text style={[styles.batteryText, { color: colors.gray700 }]}>
    {solenoidStatus.batteryLevel}%
  </Text>
</View>
```

### 5. Emergency Controls

**Location**: `services/solenoidControlService.js`

```javascript
export const emergencyUnlock = async () => {
  try {
    const commandData = {
      command: 'emergency_unlock',
      timestamp: new Date().toISOString(),
      status: 'pending',
      adminId: 'admin',
      priority: 'high',
      deviceResponse: '',
      executedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const commandRef = doc(db, SOLENOID_CONTROL_COLLECTION, `emergency_${Date.now()}`);
    await setDoc(commandRef, commandData);

    return { success: true, commandId: commandRef.id };
  } catch (error) {
    console.error('Error sending emergency unlock command:', error);
    return { success: false, error: error.message };
  }
};
```

## Device Status Structure

```javascript
// Firestore Document: solenoid_control/device_status
{
  solenoidStatus: 'locked', // locked, unlocked, unknown
  deviceOnline: true,
  lastUpdate: '2024-01-15T10:30:00Z',
  batteryLevel: 85,
  temperature: 28,
  humidity: 65,
  wifiSignal: -45,
  firmwareVersion: 'v1.2.0',
  uptimeSeconds: 3600,
  totalCommands: 245,
  lastCommand: 'unlock_1705318200000',
  errors: []
}
```

## Security Features

### Command Authentication
- Admin-only access to solenoid controls
- Command timestamping and audit trail
- Device response validation

### Safety Mechanisms
- Auto-lock after specified duration
- Emergency unlock for critical situations
- Battery level monitoring for maintenance
- Offline device detection

### Error Handling
- Network failure: Commands queued until reconnect
- Device offline: Clear status indication
- Invalid commands: Error logging and notification
- Battery low: Warning alerts

## Firebase Collections Summary

```
Smart Bisyaroh Firebase (Extended)
├── 📁 solenoid_control/
│   ├── 📄 unlock_{timestamp}/
│   │   ├── command: "unlock"
│   │   ├── duration: 30
│   │   ├── status: "executed"
│   │   ├── adminId: "admin"
│   │   ├── executedAt: Date
│   │   └── deviceResponse: "Success"
│   │
│   ├── 📄 device_status/
│   │   ├── solenoidStatus: "locked"
│   │   ├── deviceOnline: true
│   │   ├── batteryLevel: 85
│   │   ├── lastUpdate: Date
│   │   └── ...
│   │
│   └── 📄 lock_{timestamp}/
│       ├── command: "lock"
│       ├── status: "executed"
│       └── ...
│
├── 📁 hardware_payment_sessions/
│   └── 📄 {userId}_{timestamp}/
│       ├── userId: "user123"
│       ├── amount: 5000
│       ├── status: "waiting"
│       ├── isActive: true
│       ├── expiryTime: Date
│       ├── rfidCode: ""
│       ├── detectedAmount: 0
│       └── ...
│
└── 📁 [existing collections]
    ├── users/
    ├── payments/
    ├── active_timeline/
    └── rfid_pairing/
```

## Future Enhancements

1. **NFC Support**: Alternative to RFID
2. **QR Code**: Backup identification method
3. **Biometrics**: Fingerprint authentication
4. **Multi-currency**: More denomination support
5. **Receipt printing**: Thermal printer integration
6. **Voice feedback**: Audio confirmations
7. **Batch operations**: Multiple student payments
8. **Analytics dashboard**: Payment insights
9. **Scheduled Commands**: Automated lock/unlock timing
10. **Multi-device Control**: Multiple ESP32 devices management
11. **Advanced Security**: Encrypted commands, certificate authentication
12. **Mobile Alerts**: Push notifications for device status changes