# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/app/(admin)` directory.

## Directory Overview

The `/app/(admin)` directory contains all admin panel screens for the Smart Bisyaroh system. This section provides comprehensive management tools for TPQ administrators.

## Admin Panel Architecture

### Layout Structure
- **`_layout.jsx`** - Stack navigator for admin screens without headers
- **`index.jsx`** - Main admin dashboard with revolutionary mode-based solenoid control

### Core Admin Screens

#### Student Management
- **`tambah-santri.jsx`** - Add new student and create parent account
- **`daftar-santri.jsx`** - Student list with search and management
- **`detail-santri.jsx`** - Detailed student information and actions
- **`edit-santri.jsx`** - Edit student information

#### Payment Management
- **`timeline-manager.jsx`** - Manage payment schedules and periods
- **`create-timeline.jsx`** - Create new payment timeline
- **`payment-manager.jsx`** - Process payments and manage credit
- **`payment-status.jsx`** - View payment status across all students
- **`user-payment-detail.jsx`** - Detailed payment history for specific student

## Key Features

### Revolutionary Mode-Based Control
The admin dashboard features ultra-modern ESP32 control via Firebase RTDB:

```javascript
// Mode-based solenoid control
const handleUnlockSolenoid = async (duration = 30) => {
  const result = await unlockSolenoid(duration);
  if (result.success) {
    startCountdown(duration);
    // ESP32 detects change in 1 second
  }
};
```

### Admin Dashboard Features
- **🔓 Solenoid Control** - Direct hardware control with countdown timer
- **📊 Real-time Status** - Live mode monitoring (idle/solenoid/pairing/payment)
- **🎲 Data Seeder** - Generate test accounts for development
- **🔄 Pull-to-Refresh** - Real-time data synchronization

### Student Management Workflow
1. **Add Student** → Create student profile and parent account
2. **RFID Pairing** → Assign RFID cards to students
3. **Payment Setup** → Configure payment schedules
4. **Monitoring** → Track payment status and history

## Theme and Styling

### Admin Theme Colors
- **Primary**: Blue (`#3b82f6`)
- **Secondary**: Light blue variations
- **Accent**: Orange (`#f97316`)
- **Success**: Green (`#059669`)
- **Warning**: Orange (`#f59e0b`)
- **Error**: Red (`#ef4444`)

### Design Patterns
- **Card-based layout** with shadows and rounded corners
- **Icon-based navigation** with descriptive text
- **Status badges** for real-time feedback
- **Modal dialogs** for confirmations and forms
- **Loading states** with activity indicators

## Navigation Flow

```
Admin Dashboard (index.jsx)
├── Tambah Santri (tambah-santri.jsx)
├── Daftar Santri (daftar-santri.jsx)
│   ├── Detail Santri (detail-santri.jsx)
│   └── Edit Santri (edit-santri.jsx)
├── Timeline Manager (timeline-manager.jsx)
│   └── Create Timeline (create-timeline.jsx)
└── Payment Management
    ├── Payment Manager (payment-manager.jsx)
    ├── Payment Status (payment-status.jsx)
    └── User Payment Detail (user-payment-detail.jsx)
```

## Common Admin Operations

### Student Registration
```javascript
// Create student with parent account
const studentData = {
  namaSantri: "...",
  namaWali: "...",
  email: "...",
  noHP: "...",
  rfidSantri: "..." // Optional RFID assignment
};
```

### Payment Timeline Creation
```javascript
// Create payment schedule
const timelineData = {
  namaTimeline: "...",
  jenisTagihan: "harian|mingguan|bulanan|tahunan",
  jumlahTagihan: 5000,
  tanggalMulai: "...",
  tanggalSelesai: "...",
  hariLibur: ["sabtu", "minggu"] // Optional holidays
};
```

### Hardware Control
```javascript
// Revolutionary mode-based control
await unlockSolenoid(30); // 30 second unlock
await lockSolenoid(); // Immediate lock
// ESP32 receives updates in 1 second via RTDB
```

## Service Integration

### Core Services Used
- **`rtdbModeService`** - Mode-based hardware communication
- **`userService`** - Student CRUD operations
- **`timelineService`** - Payment schedule management
- **`paymentStatusManager`** - Payment calculations
- **`seederService`** - Development data generation

### Authentication & Authorization
- **Admin-only access** - Routes protected by role-based guards
- **Firebase Authentication** - Secure user management
- **Session persistence** - Automatic login state maintenance

## Development Guidelines

### Adding New Admin Screens
1. Create new screen in `/app/(admin)/` directory
2. Add screen to `_layout.jsx` Stack navigator
3. Follow existing theming and styling patterns
4. Implement proper navigation and error handling
5. Add loading states and user feedback

### Working with Hardware Integration
- Use `rtdbModeService` for all ESP32 communication
- Implement proper error handling for hardware failures
- Show real-time status updates to users
- Handle timeouts and mode conflicts gracefully

### Data Management
- Use pull-to-refresh for real-time updates
- Implement proper loading states
- Handle offline scenarios gracefully
- Validate all form inputs before submission

## Testing and Development

### Data Seeder
The admin panel includes a powerful data seeder for development:
- **Sequential email generation** (`user1@gmail.com`, `user2@gmail.com`, etc.)
- **Automated student data** with Indonesian names
- **RFID assignment** with unique codes
- **Batch creation** (1-10 accounts at once)

### Hardware Simulator
Use `npm run test` to simulate ESP32 interactions during development.