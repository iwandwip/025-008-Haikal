# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/firebase-cleanup` directory.

## Directory Overview

The `/firebase-cleanup` directory contains powerful administrative tools for managing Firebase database cleanup and maintenance operations. This is a critical utility for database management and development workflow optimization.

## Cleanup Tools

### Core Files
- **`cleanup.js`** - Interactive Firebase database cleanup utility
- **`serviceAccountKey.json`** - Firebase Admin SDK service account credentials
- **`.gitignore`** - Protects sensitive credentials from version control

## Key Features

### Interactive Cleanup Utility
Revolutionary database management tool with comprehensive cleanup options:

```javascript
// Firebase Admin SDK initialization
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
```

### Protected Account System
Built-in protection for critical accounts:

```javascript
const PROTECTED_EMAILS = [
  'admin@gmail.com'  // Special admin account protection
];

// Prevents accidental deletion of essential accounts
const isProtectedAccount = (email) => {
  return PROTECTED_EMAILS.includes(email);
};
```

### Comprehensive Data Management
Advanced database operations with safety mechanisms:

```javascript
// Batch user retrieval with pagination
async function getAllAuthUsers() {
  const users = [];
  let nextPageToken;
  
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    users.push(...listUsersResult.users);
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  
  return users;
}

// Firestore data retrieval
async function getAllFirestoreUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const users = [];
  snapshot.forEach(doc => {
    users.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return users;
}
```

## Cleanup Operations

### Available Cleanup Functions

#### 1. User Data Cleanup
```javascript
// Remove test users and orphaned accounts
const cleanupTestUsers = async () => {
  const authUsers = await getAllAuthUsers();
  const firestoreUsers = await getAllFirestoreUsers();
  
  // Find users created by seeder (user1@gmail.com, user2@gmail.com, etc.)
  const seederUsers = authUsers.filter(user => 
    user.email && user.email.match(/^user\d+@gmail\.com$/)
  );
  
  // Confirm deletion with user
  const shouldDelete = await confirmDeletion(seederUsers.length);
  if (shouldDelete) {
    await batchDeleteUsers(seederUsers);
  }
};
```

#### 2. Payment Data Cleanup
```javascript
// Clean payment history and timelines
const cleanupPaymentData = async () => {
  const collections = [
    'active_timeline',
    'payments',
    'bridge_logs'
  ];
  
  for (const collectionName of collections) {
    await cleanupCollection(collectionName);
  }
};
```

#### 3. Realtime Database Cleanup
```javascript
// Clean RTDB mode-based data
const cleanupRealtimeDatabase = async () => {
  const rtdb = admin.database();
  
  // Reset mode-based system to idle
  await rtdb.ref('/mode').set('idle');
  await rtdb.ref('/pairing_mode').set('');
  await rtdb.ref('/payment_mode').remove();
  await rtdb.ref('/solenoid_command').set('locked');
  
  console.log('✅ RTDB mode-based system reset to idle state');
};
```

### Interactive Menu System
```javascript
// Dynamic inquirer-based menu
const mainMenu = async () => {
  const { default: inquirer } = await import('inquirer');
  
  const choices = [
    {
      name: '🧹 Clean Test Users (user1@gmail.com, user2@gmail.com, etc.)',
      value: 'clean_test_users'
    },
    {
      name: '💰 Clean Payment Data (timelines, payments, logs)',
      value: 'clean_payment_data'
    },
    {
      name: '🔄 Reset RTDB Mode System',
      value: 'reset_rtdb'
    },
    {
      name: '🗑️ Complete Database Reset (DANGEROUS)',
      value: 'complete_reset'
    },
    {
      name: '📊 Show Database Statistics',
      value: 'show_stats'
    },
    {
      name: '❌ Exit',
      value: 'exit'
    }
  ];
  
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices
  });
  
  return action;
};
```

## Safety Mechanisms

### Confirmation System
```javascript
// Multi-level confirmation for destructive operations
const confirmDeletion = async (count) => {
  const { default: inquirer } = await import('inquirer');
  
  const { confirm } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Are you sure you want to delete ${count} users? This action cannot be undone.`,
    default: false
  });
  
  if (confirm && count > 10) {
    // Extra confirmation for large deletions
    const { doubleConfirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'doubleConfirm',
      message: 'This will delete a large number of users. Are you absolutely sure?',
      default: false
    });
    
    return doubleConfirm;
  }
  
  return confirm;
};
```

### Protected Account Handling
```javascript
// Skip protected accounts during cleanup
const filterProtectedAccounts = (users) => {
  return users.filter(user => {
    if (PROTECTED_EMAILS.includes(user.email)) {
      console.log(`⚠️ Skipping protected account: ${user.email}`);
      return false;
    }
    return true;
  });
};
```

### Batch Processing with Rate Limiting
```javascript
// Rate-limited batch operations
const batchDeleteUsers = async (users, batchSize = 10) => {
  const filteredUsers = filterProtectedAccounts(users);
  
  for (let i = 0; i < filteredUsers.length; i += batchSize) {
    const batch = filteredUsers.slice(i, i + batchSize);
    
    // Delete auth users
    const deletePromises = batch.map(user => 
      auth.deleteUser(user.uid).catch(error => {
        console.error(`Failed to delete user ${user.email}:`, error.message);
        return null;
      })
    );
    
    await Promise.all(deletePromises);
    
    // Delete Firestore profiles
    const firestoreBatch = db.batch();
    batch.forEach(user => {
      const userRef = db.collection('users').doc(user.uid);
      firestoreBatch.delete(userRef);
    });
    
    await firestoreBatch.commit();
    
    // Rate limiting
    await delay(1000);
    
    console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filteredUsers.length/batchSize)}`);
  }
};
```

## Usage Instructions

### Running the Cleanup Tool
```bash
# Navigate to firebase-cleanup directory
cd firebase-cleanup

# Install dependencies (if needed)
npm install inquirer firebase-admin

# Run the interactive cleanup tool
npm run cleanup
# or
node cleanup.js
```

### Setup Requirements
1. **Service Account Key** - Download from Firebase Console
2. **Admin Permissions** - Ensure service account has proper permissions
3. **Backup Database** - Always backup before major cleanup operations
4. **Test Environment** - Prefer testing on development databases

## Development Guidelines

### Adding New Cleanup Functions
```javascript
// Template for new cleanup function
const cleanupNewFeature = async () => {
  try {
    console.log('🧹 Starting new feature cleanup...');
    
    // 1. Gather data to be cleaned
    const dataToClean = await getDataToClean();
    
    // 2. Show user what will be deleted
    console.log(`Found ${dataToClean.length} items to clean`);
    
    // 3. Get confirmation
    const confirmed = await confirmOperation(dataToClean.length);
    if (!confirmed) {
      console.log('❌ Operation cancelled by user');
      return;
    }
    
    // 4. Perform cleanup with progress
    await performCleanupWithProgress(dataToClean);
    
    console.log('✅ New feature cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Add to menu choices
const newChoice = {
  name: '🆕 Clean New Feature Data',
  value: 'clean_new_feature'
};
```

### Error Handling Patterns
```javascript
// Robust error handling for Firebase operations
const safeFirebaseOperation = async (operation, context) => {
  try {
    await operation();
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️ User already deleted: ${context}`);
    } else if (error.code === 'permission-denied') {
      console.error(`❌ Permission denied for: ${context}`);
    } else {
      console.error(`❌ Error in ${context}:`, error.message);
    }
  }
};
```

## Security Considerations

### Service Account Security
```javascript
// Secure service account handling
if (!serviceAccount.private_key) {
  console.error('❌ Invalid service account key');
  process.exit(1);
}

// Check required permissions
const requiredScopes = [
  'https://www.googleapis.com/auth/firebase.database',
  'https://www.googleapis.com/auth/cloud-platform'
];
```

### Access Control
- **Admin-only tool** - Restrict access to authorized personnel
- **Service account permissions** - Minimal required permissions
- **Audit logging** - Log all cleanup operations
- **Confirmation requirements** - Multi-step confirmation for destructive operations

## Monitoring and Logging

### Operation Logging
```javascript
// Comprehensive operation logging
const logOperation = (operation, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    details,
    user: process.env.USER || 'unknown'
  };
  
  console.log(`📝 [${timestamp}] ${operation}:`, details);
  
  // Optional: Save to log file
  // fs.appendFileSync('cleanup.log', JSON.stringify(logEntry) + '\n');
};
```

### Statistics Tracking
```javascript
// Database statistics
const showDatabaseStats = async () => {
  console.log('📊 Database Statistics:');
  
  const authUsers = await getAllAuthUsers();
  const firestoreUsers = await getAllFirestoreUsers();
  
  console.log(`Auth Users: ${authUsers.length}`);
  console.log(`Firestore Users: ${firestoreUsers.length}`);
  
  // Count seeder users
  const seederUsers = authUsers.filter(user => 
    user.email && user.email.match(/^user\d+@gmail\.com$/)
  );
  console.log(`Seeder Users: ${seederUsers.length}`);
  
  // Payment data stats
  const timelineSnapshot = await db.collection('active_timeline').get();
  console.log(`Active Timelines: ${timelineSnapshot.size}`);
};
```

## Best Practices

### Pre-Cleanup Checklist
1. **Backup database** - Export current data
2. **Test on development** - Verify cleanup logic
3. **Review protected accounts** - Ensure essential accounts are protected
4. **Check dependencies** - Verify no critical data dependencies
5. **Plan rollback** - Have rollback strategy ready

### Post-Cleanup Verification
1. **Verify deletions** - Confirm intended data removed
2. **Check protected accounts** - Ensure protected accounts intact
3. **Test application** - Verify app functionality
4. **Monitor errors** - Watch for cleanup-related issues
5. **Document changes** - Log cleanup operations performed