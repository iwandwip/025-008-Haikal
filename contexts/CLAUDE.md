# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/contexts` directory.

## Directory Overview

The `/contexts` directory contains React Context providers that manage global application state for the Smart Bisyaroh system. These contexts provide centralized state management for authentication, theming, settings, and notifications.

## Context Providers

### Core Contexts
- **`AuthContext.jsx`** - Authentication state and user management
- **`NotificationContext.jsx`** - Global notification and toast system
- **`SettingsContext.jsx`** - Application settings and preferences
- **`ThemeContext.jsx`** - Theme management and switching

## Key Features

### Authentication Context
Comprehensive authentication and user management:

```javascript
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful degradation for missing context
    return {
      currentUser: null,
      userProfile: null,
      loading: false,
      authInitialized: true,
      isAdmin: false,
      refreshProfile: () => {},
    };
  }
  return context;
};
```

### Special Admin Detection
Built-in admin role detection with multiple criteria:

```javascript
const checkAdminStatus = (user, profile) => {
  return (
    user?.email === "admin@gmail.com" ||  // Special admin email
    profile?.role === "admin" ||          // Role-based admin
    profile?.isAdmin                      // Flag-based admin
  );
};
```

### Notification System
Sophisticated notification management with role-based features:

```javascript
export const NotificationProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const timeoutRefs = useRef(new Map());
  
  const isUserRole = () => {
    return userProfile && userProfile.role === "user";
  };
  
  // Role-specific notification handling
};
```

## Context Architecture

### Authentication State Management
```javascript
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      loadUserProfile(user);
    });
    
    return unsubscribe;
  }, []);
};
```

### Profile Loading with Retry Logic
```javascript
const loadUserProfile = async (user, retryCount = 0) => {
  if (!user) {
    setUserProfile(null);
    setIsAdmin(false);
    return;
  }
  
  try {
    const result = await getUserProfile(user.uid);
    if (result.success) {
      const adminStatus = checkAdminStatus(user, result.profile);
      setIsAdmin(adminStatus);
      setUserProfile(result.profile);
    }
  } catch (error) {
    // Handle profile loading errors with retry
    if (retryCount < 3) {
      setTimeout(() => loadUserProfile(user, retryCount + 1), 1000);
    }
  }
};
```

## Notification Context Features

### Multi-Type Notifications
```javascript
// General notifications
const showGeneralNotification = (title, message, type, options = {}) => {
  const id = ++notificationId.current;
  const notification = {
    id,
    title,
    message,
    type, // 'success' | 'error' | 'warning' | 'info'
    timestamp: Date.now(),
    ...options
  };
  
  setNotifications(prev => [...prev, notification]);
  setVisible(true);
};

// Specialized payment notifications
const showPaymentSuccessNotification = (paymentData) => {
  // Custom payment success handling
};

const showCreditBalanceNotification = (balance) => {
  // Credit balance updates
};
```

### Auto-Dismissal System
```javascript
// Automatic notification cleanup
useEffect(() => {
  notifications.forEach(notification => {
    if (!timeoutRefs.current.has(notification.id)) {
      const duration = notification.duration || 4000;
      const timeoutId = setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
      
      timeoutRefs.current.set(notification.id, timeoutId);
    }
  });
}, [notifications]);
```

## Settings Context

### Application Settings Management
```javascript
export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('id');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Persist settings to AsyncStorage
  const updateSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
      // Update state based on key
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };
};
```

## Theme Context Integration

### Role-Based Theme Management
```javascript
export const ThemeProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const [isDark, setIsDark] = useState(false);
  
  const currentTheme = useMemo(() => {
    return getThemeByRole(isAdmin, isDark);
  }, [isAdmin, isDark]);
  
  return (
    <ThemeContext.Provider value={{
      theme: currentTheme,
      isDark,
      isAdmin,
      toggleTheme: () => setIsDark(!isDark)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Usage Patterns

### Authentication Usage
```javascript
const Component = () => {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    isAdmin, 
    refreshProfile 
  } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <LoginScreen />;
  }
  
  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};
```

### Notification Usage
```javascript
const Component = () => {
  const { 
    showGeneralNotification,
    showPaymentSuccessNotification,
    showErrorNotification 
  } = useNotification();
  
  const handleAction = async () => {
    try {
      const result = await performAction();
      showGeneralNotification(
        "Berhasil", 
        "Aksi berhasil dilakukan", 
        "success"
      );
    } catch (error) {
      showErrorNotification("Error", error.message);
    }
  };
};
```

### Settings Usage
```javascript
const Component = () => {
  const { 
    theme, 
    setTheme, 
    notifications, 
    setNotifications 
  } = useSettings();
  
  return (
    <SettingsScreen 
      currentTheme={theme}
      onThemeChange={setTheme}
      notificationsEnabled={notifications}
      onNotificationsChange={setNotifications}
    />
  );
};
```

## Error Handling

### Context Error Boundaries
```javascript
// Graceful context degradation
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return safe defaults instead of throwing
    return {
      currentUser: null,
      userProfile: null,
      loading: false,
      authInitialized: true,
      isAdmin: false,
      refreshProfile: () => {},
    };
  }
  return context;
};
```

### Retry Mechanisms
```javascript
// Profile loading with exponential backoff
const loadUserProfile = async (user, retryCount = 0) => {
  try {
    const result = await getUserProfile(user.uid);
    // Handle success
  } catch (error) {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      setTimeout(() => loadUserProfile(user, retryCount + 1), delay);
    }
  }
};
```

## Performance Optimization

### Context Splitting
```javascript
// Separate contexts to prevent unnecessary re-renders
const AuthProvider = ({ children }) => {
  // Authentication-specific state
};

const NotificationProvider = ({ children }) => {
  // Notification-specific state
};

// Compose contexts
const App = () => (
  <AuthProvider>
    <NotificationProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </NotificationProvider>
  </AuthProvider>
);
```

### Memoization
```javascript
// Memoize context values
const AuthProvider = ({ children }) => {
  const contextValue = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    isAdmin,
    refreshProfile
  }), [currentUser, userProfile, loading, isAdmin]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Development Guidelines

### Creating New Contexts
1. **Single responsibility** - Each context manages one concern
2. **Error handling** - Provide fallback values for missing contexts
3. **Performance** - Use useMemo for context values
4. **TypeScript** - Define clear interfaces for context values
5. **Testing** - Mock contexts for component testing

### Context Best Practices
- **Provider composition** - Nest providers at root level
- **Selective updates** - Split contexts to minimize re-renders
- **Cleanup** - Remove event listeners and timeouts
- **Persistence** - Save important state to AsyncStorage
- **Debugging** - Add development-only logging

## Testing Considerations

### Context Testing
```javascript
// Mock context provider for testing
const MockAuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

// Test component with mocked context
test('renders with admin user', () => {
  const mockAuthValue = {
    currentUser: { uid: 'test-uid' },
    isAdmin: true,
    loading: false
  };
  
  render(
    <MockAuthProvider value={mockAuthValue}>
      <TestComponent />
    </MockAuthProvider>
  );
});
```

### Integration Testing
- **Auth flow testing** - Test login/logout scenarios
- **Notification testing** - Test notification display and dismissal
- **Settings persistence** - Test setting save/load
- **Error scenarios** - Test network failures and retries

## Security Considerations

### Authentication Security
- **Token validation** - Verify Firebase tokens
- **Role verification** - Server-side role validation
- **Session management** - Proper logout handling
- **Profile security** - Sanitize user profile data

### Data Protection
- **Sensitive data** - Avoid storing sensitive info in context
- **Access control** - Role-based access to context features
- **Audit logging** - Log important state changes
- **Error information** - Don't expose sensitive error details