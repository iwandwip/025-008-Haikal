# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/app/(auth)` directory.

## Directory Overview

The `/app/(auth)` directory contains all authentication screens for the Smart Bisyaroh system. This handles role-based login flows for both Admin and Wali (Parent) users.

## Authentication Architecture

### Layout Structure
- **`_layout.jsx`** - Stack navigator for auth screens without headers
- **Role-based authentication** with separate login flows

### Authentication Screens

#### Admin Authentication
- **`admin-login.jsx`** - Admin login with email/password
- **`admin-register.jsx`** - Admin registration (if needed)

#### Parent Authentication  
- **`wali-login.jsx`** - Parent (Wali) login with email/password

## Key Features

### Role-Based Authentication
The system uses Firebase Authentication with role-based access control:

```javascript
// Authentication flow
const result = await signInWithEmail(email, password);
if (result.success) {
  // Route based on user role
  if (userProfile.role === "admin") {
    router.replace("/(admin)");
  } else if (userProfile.role === "user") {
    router.replace("/(tabs)");
  }
}
```

### Special Admin Account
- **Email**: `admin@gmail.com`
- **Password**: Any password (for development)
- **Auto-role assignment**: Automatically gets admin privileges

### Authentication Features
- **Email/Password login** for both roles
- **Form validation** with error messaging
- **Loading states** during authentication
- **Keyboard handling** for mobile devices
- **Back navigation** to role selection
- **Auto-redirect** after successful login

## Theme and Styling

### Role-Based Theming
- **Admin Login**: Blue theme (`#3b82f6`)
- **Wali Login**: Green theme (`#10b981`)
- **Consistent UI patterns** across both flows

### Design Patterns
- **Full-screen layouts** with safe area handling
- **Keyboard-aware scrolling** for mobile
- **Card-based forms** with rounded corners
- **Loading states** with activity indicators
- **Error messaging** via alerts and inline text

## Navigation Flow

```
Role Selection
├── Admin Login (admin-login.jsx)
│   ├── Admin Register (admin-register.jsx)
│   └── → Admin Dashboard (/(admin))
└── Wali Login (wali-login.jsx)
    └── → Parent Interface (/(tabs))
```

## Form Validation

### Input Validation
```javascript
// Email and password validation
if (!email.trim() || !password.trim()) {
  Alert.alert("Error", "Mohon isi email dan password");
  return;
}

// Email format validation (if needed)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  Alert.alert("Error", "Format email tidak valid");
  return;
}
```

### Error Handling
- **Network errors** - Handle connection issues
- **Invalid credentials** - Show user-friendly messages
- **Firebase errors** - Map to Indonesian error messages
- **Form validation** - Prevent submission with invalid data

## Service Integration

### Core Services Used
- **`authService`** - Firebase Authentication wrapper
- **`userService`** - User profile management
- **Form validation** - Input sanitization and validation

### Authentication Flow
1. **User input** - Email and password collection
2. **Validation** - Client-side form validation
3. **Firebase Auth** - Secure authentication via Firebase
4. **Profile loading** - Fetch user profile and role
5. **Route redirect** - Navigate based on user role

## User Experience

### Loading States
- **Button loading** - Show spinner during auth
- **Disabled inputs** - Prevent multiple submissions
- **Loading text** - Clear feedback to users

### Keyboard Handling
- **KeyboardAvoidingView** - Prevent keyboard overlap
- **Auto-focus** - Smooth input navigation
- **Submit on enter** - Keyboard shortcuts

### Error Messages
- **Indonesian language** - Localized error messages
- **Clear instructions** - Help users resolve issues
- **Alert dialogs** - Prominent error display

## Development Guidelines

### Adding New Auth Screens
1. Create new screen in `/app/(auth)/` directory
2. Add screen to `_layout.jsx` Stack navigator
3. Follow existing theming patterns for the role
4. Implement proper form validation
5. Add loading states and error handling

### Working with Firebase Auth
- Use `authService` wrapper for all auth operations
- Handle all Firebase error codes appropriately
- Implement proper loading states
- Test with various network conditions

### Form Best Practices
- **Input validation** - Both client and server-side
- **Accessibility** - Screen reader support
- **Mobile optimization** - Touch-friendly controls
- **Error recovery** - Clear error messages and solutions

## Testing Considerations

### Test Cases
- **Valid credentials** - Normal login flow
- **Invalid credentials** - Error handling
- **Network failures** - Offline scenarios
- **Special admin account** - Development login
- **Role-based routing** - Correct navigation

### Development Helpers
- **Special admin account** - `admin@gmail.com` (any password)
- **Test accounts** - Generated via seeder service
- **Error simulation** - Network and auth failures

## Security Considerations

### Authentication Security
- **Firebase Auth** - Industry-standard security
- **Client-side validation** - Input sanitization
- **No password storage** - Firebase handles securely
- **Session management** - Automatic token refresh

### Role-Based Access
- **Server-side validation** - Firebase rules
- **Client-side guards** - Route protection
- **Profile verification** - Role confirmation