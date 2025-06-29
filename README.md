# Smart Bisyaroh - TPQ Payment Management System

A comprehensive IoT-enabled payment management system for TPQ (Taman Pendidikan Quran) Ibadurrohman, combining React Native mobile app with ESP32 hardware for automated RFID-based payments and intelligent currency recognition.

## Features

### 🏫 Educational Institution Management
- **Multi-role authentication** - Admin and Parent (Wali) access with role-based permissions
- **Student management** - Complete student registration and profile management
- **Timeline-based payments** - Flexible payment schedules (daily, weekly, monthly, yearly)
- **Real-time payment tracking** - Live status updates and payment history

### 🏷️ RFID Integration
- **Student identification** - RFID card-based student recognition
- **Real-time pairing** - Live RFID card assignment to students
- **Hardware communication** - ESP32 integration via Firebase Realtime Database

### 🧠 Machine Learning
- **Currency recognition** - KNN algorithm for automatic bill detection
- **Color sensor integration** - TCS3200 sensor for identifying IDR denominations
- **Training data** - Pre-trained model for 2000, 5000, and 10000 IDR bills

### 💰 Payment Processing
- **Automated calculations** - Smart payment distribution across periods
- **Credit management** - Overpayment handling and credit balance tracking
- **Holiday management** - Exclude specific periods from payment schedules
- **Status automation** - Automatic late payment detection and status updates

### 🔧 Hardware Features
- **ESP32 firmware** - Complete IoT device management
- **LCD interface** - 16x2 display with button navigation
- **Multi-sensor support** - RFID, color sensor, LEDs, buzzer, servo, relay
- **WiFi connectivity** - Real-time synchronization with Firebase

### 📱 Mobile Application  
- **Cross-platform** - React Native with Expo for iOS, Android, and Web
- **Modern UI** - Clean Indonesian-language interface
- **Real-time updates** - Live payment status and notifications
- **Offline support** - Local data caching and sync

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Setup Firebase

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore Database
4. Get your Firebase config from Project Settings
5. Replace the config in `services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN", 
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 3. Run the App

```bash
npm start
# or 
yarn start
```

## Customization

### Colors
Edit `constants/Colors.js` to customize your app's color scheme:

```javascript
export const lightTheme = {
  primary: '#YOUR_PRIMARY_COLOR',
  secondary: '#YOUR_SECONDARY_COLOR',
  // ... other colors
};
```

### App Name & Assets
1. Update `app.json` with your app name and metadata
2. Replace assets in `/assets/` folder:
   - `icon.png` - App icon
   - `splash.png` - Splash screen
   - `adaptive-icon.png` - Android adaptive icon
   - `favicon.png` - Web favicon

### Translations
Add or modify translations in `constants/translations.js`:

```javascript
export const translations = {
  en: {
    // English translations
  },
  id: {
    // Indonesian translations  
  },
  // Add more languages
};
```

## Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs (Home, Table, Settings)
│   ├── (admin)/           # Admin panel
│   └── _layout.jsx        # Root layout
├── components/            # Reusable components
│   ├── auth/             # Auth-related components
│   ├── ui/               # UI components (Button, Input, DataTable)
│   └── illustrations/    # Auth screen illustrations
├── contexts/             # React contexts
├── services/             # API services
├── utils/                # Utility functions
├── constants/            # App constants
└── hooks/                # Custom hooks
```

## Authentication Flow

### Regular User Registration
1. User enters email, password, name, birthdate, gender
2. Account created in Firebase Auth
3. Profile saved to Firestore with user role

### Admin Access  
- Use email: `admin@gmail.com` with any password
- Automatically gets admin role and permissions
- Access to admin panel with user management

## User Roles

- **User**: Regular users with profile management and table access
- **Admin**: Full access to admin panel and user management

## Data Table Features

- 📊 **Interactive Table** - Clean, responsive data table component
- 🎲 **Sample Data Generator** - Generate random data for testing
- 🔄 **Sorting** - Sort data by date (newest/oldest first)
- ✏️ **Edit & Delete** - Action buttons for data management
- 🧹 **Clear All** - Remove all data with confirmation
- 📱 **Mobile Responsive** - Horizontal scroll for mobile devices

## Technologies Used

- React Native with Expo
- Firebase (Auth + Firestore)
- Expo Router
- AsyncStorage for local preferences
- React Context for state management

## License

MIT License - feel free to use this template for your projects.

## Support

For issues and questions, please create an issue on the repository.