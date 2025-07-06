# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/app` directory.

## Directory Overview

The `/app` directory contains the main application screens and navigation structure using Expo Router's file-based routing system.

## Key Files

### Core App Files
- **`_layout.jsx`** - Root layout component that wraps the entire app with providers
- **`index.jsx`** - Main entry point that handles authentication routing
- **`role-selection.jsx`** - Initial screen for selecting user role (Admin vs Wali)

### Layout Structure
```javascript
// Root layout wraps app with essential providers
<ErrorBoundary>
  <SettingsProvider>
    <AuthProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <ToastNotification />
      </NotificationProvider>
    </AuthProvider>
  </SettingsProvider>
</ErrorBoundary>
```

## Authentication Flow

### 1. App Entry Point (`index.jsx`)
- Checks authentication status and user profile
- Routes authenticated users based on role:
  - `admin` → `/(admin)` 
  - `user` → `/(tabs)`
  - No profile → `/role-selection`

### 2. Role Selection (`role-selection.jsx`)
- Displays two role options: Admin TPQ and Wali Santri
- Routes to appropriate auth screens:
  - Admin → `/(auth)/admin-login`
  - Wali → `/(auth)/wali-login`

## Navigation Structure

```
app/
├── _layout.jsx           # Root layout with providers
├── index.jsx             # Authentication router
├── role-selection.jsx    # Role selection screen
├── (auth)/              # Authentication screens
├── (admin)/             # Admin panel screens
└── (tabs)/              # Parent/user interface screens
```

## Context Providers

The app uses multiple React Context providers for global state:

- **`AuthProvider`** - Authentication state and user management
- **`SettingsProvider`** - App settings and preferences
- **`NotificationProvider`** - Toast notifications and alerts
- **`ErrorBoundary`** - Error handling and crash prevention

## Theme and Styling

### Role-Based Theme Colors
- **Admin Theme**: Blue (`#3b82f6`)
- **Wali Theme**: Green (`#10b981`)
- **Neutral**: Gray shades for shared components

### Common Patterns
- SafeAreaView for proper screen boundaries
- Consistent padding and margins (16px, 20px, 24px)
- Shadow/elevation for card components
- Rounded corners (8px, 16px)

## Common Development Tasks

### Adding New Screens
1. Create new screen component in appropriate directory
2. Follow existing naming conventions
3. Use consistent styling patterns
4. Add proper navigation handling

### Modifying Authentication Flow
1. Update logic in `index.jsx` for routing
2. Modify role selection options if needed
3. Ensure proper context provider access
4. Test all authentication paths

### Working with Navigation
- Use `useRouter()` hook for programmatic navigation
- Follow Expo Router conventions for file-based routing
- Ensure proper screen options configuration
- Test navigation flow thoroughly