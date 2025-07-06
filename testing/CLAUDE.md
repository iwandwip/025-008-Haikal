# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/testing` directory.

## Directory Overview

The `/testing` directory contains comprehensive testing tools and simulation frameworks for the Smart Bisyaroh system. This includes ESP32 hardware simulation, testing frameworks, and development utilities.

## Testing Tools

### Core Testing Files
- **`esp32-simulator.js`** - Comprehensive ESP32 hardware simulator for development
- **`esp32-framework.cpp`** - Arduino framework code for hardware testing

## Key Features

### ESP32 Hardware Simulator
Revolutionary testing tool that simulates the complete ESP32 hardware experience:

```javascript
class ESP32RFIDSimulator {
  constructor() {
    this.pairingRef = doc(db, 'rfid_pairing', 'current_session');
    this.currentSession = null;
    this.timeoutTimer = null;
    this.processingTimer = null;
    this.isProcessing = false;
    this.isAuthenticated = false;
  }
  
  // Authenticate and start listening for pairing sessions
  async initialize() {
    await signInWithEmailAndPassword(auth, 'admin@gmail.com', 'admin123');
    this.isAuthenticated = true;
    this.startListening();
  }
}
```

### Realistic RFID Simulation
```javascript
// Generate realistic RFID codes
const generateRandomRFID = () => {
  const characters = 'ABCDEF0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result; // e.g., "A1B2C3D4"
};

// Simulate realistic hardware delays
const getRandomDelay = () => {
  return Math.floor(Math.random() * (3000 - 1000) + 1000); // 1-3 seconds
};
```

### Real-Time Pairing Simulation
```javascript
// Monitor for pairing sessions
startListening() {
  onSnapshot(this.pairingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data.status === 'waiting' && !this.isProcessing) {
        console.log('🎯 New pairing session detected!');
        this.currentSession = data;
        this.simulateRFIDDetection();
      }
    }
  });
}

// Simulate RFID card detection
simulateRFIDDetection() {
  this.isProcessing = true;
  const delay = getRandomDelay();
  
  console.log(`⏱️ Simulating RFID detection in ${delay}ms...`);
  
  this.processingTimer = setTimeout(async () => {
    const rfidCode = generateRandomRFID();
    console.log(`📱 RFID detected: ${rfidCode}`);
    
    // Update Firestore with simulated RFID
    await updateDoc(this.pairingRef, {
      rfidCode: rfidCode,
      status: 'detected',
      timestamp: new Date()
    });
    
    this.isProcessing = false;
  }, delay);
}
```

## Testing Framework Architecture

### Mode-Based Testing
The simulator supports the revolutionary mode-based architecture:

```javascript
// Simulate different ESP32 modes
const simulateModeChange = async (mode, data = {}) => {
  switch (mode) {
    case 'pairing':
      await simulateRFIDPairing(data.timeout);
      break;
    case 'payment':
      await simulatePaymentDetection(data.amount);
      break;
    case 'solenoid':
      await simulateSolenoidControl(data.command);
      break;
    case 'idle':
      await simulateIdleState();
      break;
  }
};
```

### Payment Simulation
```javascript
// Simulate currency detection
const simulatePaymentDetection = async (expectedAmount) => {
  console.log(`💰 Simulating payment detection for ${expectedAmount}...`);
  
  // Simulate color sensor reading
  const detectedAmount = simulateCurrencyRecognition();
  
  // Update RTDB payment mode
  await set(ref(rtdb, 'payment_mode/set'), {
    amount_detected: detectedAmount.toString(),
    status: detectedAmount >= expectedAmount ? 'success' : 'insufficient'
  });
  
  console.log(`✅ Payment detected: ${detectedAmount} (required: ${expectedAmount})`);
};

// Simulate KNN currency recognition
const simulateCurrencyRecognition = () => {
  const denominations = [2000, 5000, 10000];
  const accuracy = 0.95; // 95% accuracy simulation
  
  if (Math.random() < accuracy) {
    return denominations[Math.floor(Math.random() * denominations.length)];
  } else {
    return 0; // Simulate recognition failure
  }
};
```

### Solenoid Control Simulation
```javascript
// Simulate physical solenoid control
const simulateSolenoidControl = async (command) => {
  console.log(`🔐 Simulating solenoid: ${command}`);
  
  if (command === 'unlock') {
    console.log('🔓 Solenoid UNLOCKED - Access granted');
    
    // Simulate auto-lock after timeout
    setTimeout(() => {
      console.log('🔒 Solenoid AUTO-LOCKED - Timeout reached');
    }, 30000); // 30 seconds
  } else {
    console.log('🔒 Solenoid LOCKED - Access denied');
  }
};
```

## Interactive Testing Interface

### Command-Line Interface
```javascript
// Interactive testing menu
const displayMenu = () => {
  console.log('\n📱 ESP32 Simulator Commands:');
  console.log('1. 🎯 Trigger RFID Detection');
  console.log('2. 💰 Simulate Payment (2000 IDR)');
  console.log('3. 💰 Simulate Payment (5000 IDR)');
  console.log('4. 💰 Simulate Payment (10000 IDR)');
  console.log('5. 🔓 Simulate Solenoid Unlock');
  console.log('6. 🔒 Simulate Solenoid Lock');
  console.log('7. 📊 Show Current Status');
  console.log('8. ❌ Exit Simulator');
  console.log('\nSelect option (1-8):');
};

// Process user input
const processCommand = async (choice) => {
  switch (choice) {
    case '1':
      await simulateRFIDDetection();
      break;
    case '2':
      await simulatePaymentDetection(2000);
      break;
    case '3':
      await simulatePaymentDetection(5000);
      break;
    case '4':
      await simulatePaymentDetection(10000);
      break;
    case '5':
      await simulateSolenoidControl('unlock');
      break;
    case '6':
      await simulateSolenoidControl('lock');
      break;
    case '7':
      await showCurrentStatus();
      break;
  }
};
```

### Real-Time Status Monitoring
```javascript
// Monitor system status
const showCurrentStatus = async () => {
  const mode = await get(ref(rtdb, 'mode'));
  const solenoidCommand = await get(ref(rtdb, 'solenoid_command'));
  const pairingMode = await get(ref(rtdb, 'pairing_mode'));
  
  console.log('\n📊 Current System Status:');
  console.log(`Mode: ${mode.val() || 'idle'}`);
  console.log(`Solenoid: ${solenoidCommand.val() || 'locked'}`);
  console.log(`Pairing: ${pairingMode.val() || 'none'}`);
  
  // Check for active sessions
  const activeTimeline = await getDoc(doc(db, 'active_timeline', 'current'));
  if (activeTimeline.exists()) {
    console.log(`Timeline: ${activeTimeline.data().namaTimeline}`);
  }
};
```

## Arduino Framework Testing

### C++ Testing Framework
```cpp
// ESP32 testing framework in C++
class ESP32TestFramework {
  private:
    bool testMode = false;
    String mockRFID = "";
    int mockCurrency = 0;
    
  public:
    void enableTestMode() {
      testMode = true;
      Serial.println("🧪 Test mode enabled");
    }
    
    void setMockRFID(String rfid) {
      mockRFID = rfid;
      Serial.println("📱 Mock RFID set: " + rfid);
    }
    
    void setMockCurrency(int amount) {
      mockCurrency = amount;
      Serial.println("💰 Mock currency set: " + String(amount));
    }
    
    String readRFID() {
      if (testMode && mockRFID.length() > 0) {
        return mockRFID;
      }
      return readActualRFID();
    }
    
    int detectCurrency() {
      if (testMode && mockCurrency > 0) {
        return mockCurrency;
      }
      return detectActualCurrency();
    }
};
```

## Development Testing Workflow

### Running the Simulator
```bash
# Start the ESP32 simulator
npm run test
# or directly
node testing/esp32-simulator.js
```

### Testing Scenarios
```javascript
// Comprehensive testing scenarios
const testScenarios = [
  {
    name: 'RFID Pairing Success',
    steps: [
      'Start pairing mode',
      'Simulate RFID detection',
      'Verify profile update',
      'Check mode reset'
    ]
  },
  {
    name: 'Payment Processing',
    steps: [
      'Start payment mode',
      'Simulate currency detection',
      'Verify payment record',
      'Check credit balance'
    ]
  },
  {
    name: 'Solenoid Control',
    steps: [
      'Send unlock command',
      'Verify solenoid state',
      'Test auto-lock timeout',
      'Confirm security'
    ]
  }
];
```

### Automated Testing
```javascript
// Automated test runner
const runAutomatedTests = async () => {
  console.log('🚀 Starting automated test suite...');
  
  for (const scenario of testScenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    
    try {
      await executeTestSteps(scenario.steps);
      console.log(`✅ ${scenario.name} passed`);
    } catch (error) {
      console.log(`❌ ${scenario.name} failed:`, error.message);
    }
  }
};
```

## Error Simulation

### Network Failure Simulation
```javascript
// Simulate network connectivity issues
const simulateNetworkFailure = async (duration = 5000) => {
  console.log('📡 Simulating network failure...');
  
  // Temporarily disable Firebase operations
  const originalSet = rtdb.set;
  rtdb.set = () => Promise.reject(new Error('Network unavailable'));
  
  setTimeout(() => {
    rtdb.set = originalSet;
    console.log('📡 Network restored');
  }, duration);
};
```

### Hardware Failure Simulation
```javascript
// Simulate hardware component failures
const simulateHardwareFailure = (component) => {
  switch (component) {
    case 'rfid':
      console.log('❌ RFID reader failure - No card detected');
      break;
    case 'color_sensor':
      console.log('❌ Color sensor failure - Cannot detect currency');
      break;
    case 'solenoid':
      console.log('❌ Solenoid failure - Mechanical jam');
      break;
    case 'wifi':
      console.log('❌ WiFi failure - Connection lost');
      break;
  }
};
```

## Performance Testing

### Load Testing
```javascript
// Simulate multiple concurrent operations
const loadTest = async (concurrentUsers = 10) => {
  console.log(`⚡ Starting load test with ${concurrentUsers} users...`);
  
  const promises = [];
  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(simulateUserSession(i));
  }
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`📊 Load test results: ${successful} successful, ${failed} failed`);
};
```

### Response Time Testing
```javascript
// Measure system response times
const measureResponseTime = async (operation) => {
  const startTime = Date.now();
  
  try {
    await operation();
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);
    return responseTime;
  } catch (error) {
    console.log(`❌ Operation failed: ${error.message}`);
    return -1;
  }
};
```

## Development Guidelines

### Adding New Tests
1. **Realistic simulation** - Mirror actual hardware behavior
2. **Error scenarios** - Test failure conditions
3. **Performance testing** - Measure response times
4. **Edge cases** - Test boundary conditions
5. **Documentation** - Document test scenarios

### Testing Best Practices
- **Isolated tests** - Each test should be independent
- **Cleanup** - Reset state between tests
- **Assertions** - Verify expected outcomes
- **Logging** - Comprehensive test logging
- **Reproducibility** - Tests should be deterministic

## Integration with CI/CD

### Automated Testing Pipeline
```javascript
// CI/CD integration
const ciTestSuite = async () => {
  console.log('🔄 Running CI test suite...');
  
  const tests = [
    runUnitTests,
    runIntegrationTests,
    runPerformanceTests,
    runSecurityTests
  ];
  
  for (const test of tests) {
    const result = await test();
    if (!result.success) {
      process.exit(1); // Fail CI build
    }
  }
  
  console.log('✅ All tests passed');
};
```

### Test Reporting
```javascript
// Generate test reports
const generateTestReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    coverage: calculateCodeCoverage(),
    performance: calculatePerformanceMetrics()
  };
  
  console.log('📈 Test Report:', JSON.stringify(report, null, 2));
  return report;
};
```