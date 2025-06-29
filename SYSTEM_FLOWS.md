# Smart Bisyaroh System Flows Documentation

## Overview

This document details the two critical flows in the Smart Bisyaroh payment management system:
1. **RFID Pairing Flow** - Associating RFID cards with students
2. **Payment Processing Flow** - RFID-based payment with currency detection

Both flows integrate the React Native mobile app with ESP32 IoT hardware through Firebase.

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

## Future Enhancements

1. **NFC Support**: Alternative to RFID
2. **QR Code**: Backup identification method
3. **Biometrics**: Fingerprint authentication
4. **Multi-currency**: More denomination support
5. **Receipt printing**: Thermal printer integration
6. **Voice feedback**: Audio confirmations
7. **Batch operations**: Multiple student payments
8. **Analytics dashboard**: Payment insights