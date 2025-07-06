# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/services` directory.

## Directory Overview

The `/services` directory contains the core business logic and API integration layer for the Smart Bisyaroh system. This includes the revolutionary mode-based ESP32 communication, Firebase integration, and comprehensive payment management services.

## Service Architecture

### Core Services
- **`rtdbModeService.js`** - Revolutionary mode-based ESP32 communication
- **`dataBridgeService.js`** - RTDB ↔ Firestore synchronization
- **`firebase.js`** - Firebase configuration and initialization

### Authentication & User Management
- **`authService.js`** - Firebase Authentication wrapper
- **`userService.js`** - User profile CRUD operations
- **`seederService.js`** - Development data generation

### Payment System
- **`paymentStatusManager.js`** - Intelligent payment status calculation
- **`adminPaymentService.js`** - Admin payment processing
- **`waliPaymentService.js`** - Parent payment management
- **`timelineService.js`** - Payment schedule management

### Hardware Integration
- **`hardwarePaymentService.js`** - Hardware payment processing
- **`pairingService.js`** - RFID card pairing
- **`solenoidControlService.js`** - Physical access control

## Revolutionary Mode-Based Architecture

### Ultra-Simple RTDB Schema
The system uses a dramatically simplified schema achieving 90% code reduction:

```javascript
// RTDB Schema (Ultra-Simple)
{
  "mode": "idle", // "idle" | "pairing" | "payment" | "solenoid"
  "pairing_mode": "", // Empty when idle, RFID code when detected
  "payment_mode": {
    "get": { "rfid_code": "", "amount_required": "" },
    "set": { "amount_detected": "", "status": "" } // Only amount & status!
  },
  "solenoid_command": "locked" // "unlock" | "locked"
}
```

### Mode Priority System
```javascript
// Prevent race conditions with priority system
const MODE_PRIORITY = {
  'idle': 0,
  'solenoid': 1, 
  'pairing': 2,
  'payment': 3  // Highest priority
};

// Set mode with priority checking
export const setMode = async (newMode, priority = false) => {
  if (!priority) {
    const currentMode = await getMode();
    if (MODE_PRIORITY[currentMode] > MODE_PRIORITY[newMode]) {
      return { success: false, reason: 'system_busy', currentMode };
    }
  }
  
  await set(ref(rtdb, 'mode'), newMode);
  return { success: true };
};
```

### Real-Time Subscriptions
```javascript
// Subscribe to mode changes for UI updates
export const subscribeToModeChanges = (callback) => {
  const modeRef = ref(rtdb, 'mode');
  return onValue(modeRef, (snapshot) => {
    const mode = snapshot.val() || 'idle';
    callback(mode);
  });
};

// Subscribe to payment progress
export const subscribeToPaymentProgress = (callback) => {
  const paymentRef = ref(rtdb, 'payment_mode/set');
  return onValue(paymentRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};
```

## Data Bridge Pattern

### RTDB ↔ Firestore Synchronization
The data bridge service manages the flow between real-time coordination and persistent storage:

```javascript
// Bridge successful RFID pairings
export const bridgePairingResult = async (rfidCode, userId) => {
  try {
    // Update Firestore user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      rfidSantri: rfidCode,
      pairedAt: serverTimestamp()
    });
    
    // Log to audit trail
    await addDoc(collection(db, 'bridge_logs'), {
      type: 'pairing',
      rfidCode,
      userId,
      timestamp: serverTimestamp()
    });
    
    // Clean RTDB temporary data
    await remove(ref(rtdb, 'pairing_mode'));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Automatic Data Cleanup
```javascript
// Self-cleaning data patterns
export const cleanupExpiredSessions = async () => {
  const mode = await getMode();
  
  // Reset mode to idle if stuck
  if (mode !== 'idle') {
    const lastActivity = await getLastActivity();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    if (Date.now() - lastActivity > timeout) {
      await setMode('idle', true); // Force reset
      await clearAllModeData();
    }
  }
};
```

## Payment System Architecture

### Timeline-Based Payment Management
```javascript
// Payment timeline structure
const timeline = {
  namaTimeline: "Bisyaroh Harian 2024",
  jenisTagihan: "harian", // "harian" | "mingguan" | "bulanan" | "tahunan"
  jumlahTagihan: 5000,
  tanggalMulai: "2024-01-01",
  tanggalSelesai: "2024-12-31",
  hariLibur: ["sabtu", "minggu"], // Optional holidays
  aktif: true
};
```

### Intelligent Payment Status Calculation
```javascript
// Dynamic payment status calculation
export const calculatePaymentStatus = (payment, timeline) => {
  const today = new Date();
  const dueDate = new Date(payment.dueDate);
  
  if (payment.paid) {
    return 'paid';
  } else if (today > dueDate) {
    return 'overdue';
  } else {
    return 'pending';
  }
};
```

### Credit System Management
```javascript
// Overpayment handling with credit system
export const processPaymentWithCredit = async (paymentData) => {
  const { userId, amount, requiredAmount } = paymentData;
  
  if (amount >= requiredAmount) {
    // Process payment
    await updatePaymentRecord(paymentData);
    
    // Handle overpayment as credit
    const overpayment = amount - requiredAmount;
    if (overpayment > 0) {
      await addCreditBalance(userId, overpayment);
    }
    
    return { success: true, credit: overpayment };
  } else {
    return { success: false, error: 'Insufficient amount' };
  }
};
```

## Hardware Integration Services

### RFID Pairing Service
```javascript
// RFID card pairing with timeout
export const startRFIDPairing = async (timeoutSeconds = 30) => {
  try {
    // Set system to pairing mode
    const modeResult = await setMode('pairing');
    if (!modeResult.success) {
      return { success: false, reason: modeResult.reason };
    }
    
    // Start timeout timer
    setTimeout(async () => {
      const currentMode = await getMode();
      if (currentMode === 'pairing') {
        await setMode('idle', true); // Timeout reset
      }
    }, timeoutSeconds * 1000);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Solenoid Control Service
```javascript
// Physical access control
export const unlockSolenoid = async (duration = 30) => {
  try {
    // Set solenoid mode
    const modeResult = await setMode('solenoid');
    if (!modeResult.success) {
      return modeResult;
    }
    
    // Send unlock command
    await set(ref(rtdb, 'solenoid_command'), 'unlock');
    
    // Auto-lock after duration
    setTimeout(async () => {
      await set(ref(rtdb, 'solenoid_command'), 'locked');
      await setMode('idle', true);
    }, duration * 1000);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Authentication & User Services

### Firebase Authentication Wrapper
```javascript
// Simplified auth operations
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
};

// Indonesian error messages
const getErrorMessage = (errorCode) => {
  const messages = {
    'auth/user-not-found': 'Email tidak terdaftar',
    'auth/wrong-password': 'Password salah',
    'auth/invalid-email': 'Format email tidak valid',
    'auth/user-disabled': 'Akun telah dinonaktifkan'
  };
  
  return messages[errorCode] || 'Terjadi kesalahan saat masuk';
};
```

### User Profile Management
```javascript
// CRUD operations for user profiles
export const createUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'user' // Default role
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Development Guidelines

### Creating New Services
1. **Single responsibility** - Each service handles one domain
2. **Error handling** - Return consistent success/error objects
3. **Type safety** - Define clear parameter interfaces
4. **Async patterns** - Use async/await consistently
5. **Real-time integration** - Consider RTDB subscriptions
6. **Documentation** - Add comprehensive JSDoc comments

### Service Integration Pattern
```javascript
// Standard service structure
export const serviceFunction = async (params) => {
  try {
    // 1. Validate parameters
    if (!params.required) {
      return { success: false, error: 'Missing required parameter' };
    }
    
    // 2. Perform operation
    const result = await performOperation(params);
    
    // 3. Update related systems
    await updateRelatedData(result);
    
    // 4. Return success
    return { success: true, data: result };
  } catch (error) {
    // 5. Handle errors gracefully
    console.error('Service error:', error);
    return { success: false, error: error.message };
  }
};
```

### Error Handling Standards
```javascript
// Consistent error response format
const errorResponse = {
  success: false,
  error: 'Human-readable error message',
  code: 'ERROR_CODE', // Optional error code
  details: {} // Optional error details
};

// Success response format
const successResponse = {
  success: true,
  data: {}, // Response data
  message: 'Operation completed successfully' // Optional message
};
```

## Testing Considerations

### Service Testing
- **Unit tests** - Test individual service functions
- **Integration tests** - Test Firebase integration
- **Mock services** - Use mocks for external dependencies
- **Error scenarios** - Test network failures and edge cases
- **Real-time tests** - Test RTDB subscriptions

### Hardware Simulation
```javascript
// ESP32 simulator for testing
export const simulateESP32Response = async (mode, data) => {
  switch (mode) {
    case 'pairing':
      await set(ref(rtdb, 'pairing_mode'), data.rfidCode);
      break;
    case 'payment':
      await set(ref(rtdb, 'payment_mode/set'), {
        amount_detected: data.amount,
        status: 'success'
      });
      break;
  }
};
```

## Performance Optimization

### Caching Strategies
```javascript
// Cache frequently accessed data
const cache = new Map();

export const getCachedData = async (key, fetchFunction) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchFunction();
  cache.set(key, data);
  
  // Cache expiry
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 minutes
  
  return data;
};
```

### Batch Operations
```javascript
// Efficient batch processing
export const batchUpdatePayments = async (payments) => {
  const batch = writeBatch(db);
  
  payments.forEach(payment => {
    const paymentRef = doc(db, 'payments', payment.id);
    batch.update(paymentRef, payment.updates);
  });
  
  await batch.commit();
};
```

## Security Considerations

### Data Validation
```javascript
// Input sanitization
export const validateInput = (data, schema) => {
  const errors = [];
  
  Object.keys(schema).forEach(key => {
    const rule = schema[key];
    const value = data[key];
    
    if (rule.required && !value) {
      errors.push(`${key} is required`);
    }
    
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${key} must be ${rule.type}`);
    }
  });
  
  return errors.length === 0 ? null : errors;
};
```

### Access Control
```javascript
// Role-based access control
export const requireRole = (requiredRole) => {
  return (serviceFunction) => {
    return async (params, context) => {
      if (!context.user || context.user.role !== requiredRole) {
        return { success: false, error: 'Insufficient permissions' };
      }
      
      return serviceFunction(params, context);
    };
  };
};
```