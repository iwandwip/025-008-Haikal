# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/components/auth` directory.

## Directory Overview

The `/components/auth` directory contains specialized components for authentication workflows in the Smart Bisyaroh system. These components handle user registration, login, and profile management with role-based functionality.

## Authentication Components

### Core Components
- **`AuthForm.jsx`** - Comprehensive multi-step authentication form supporting login, registration, and password reset

## Key Features

### Multi-Step Authentication Form
The `AuthForm` component provides a sophisticated authentication workflow:

```javascript
<AuthForm
  type="login" // 'login' | 'register' | 'forgot-password'
  onSubmit={handleAuthSubmit}
  loading={isProcessing}
/>
```

### Special Admin Account Handling
Built-in support for the special admin account:

```javascript
// Special case for admin@gmail.com
const isAdminEmail = formData.email === "admin@gmail.com";

if (isAdminEmail) {
  // Skip personal information step
  // Auto-create admin account
  handleSubmit();
}
```

### Multi-Step Registration
Progressive form with conditional steps:

1. **Step 1**: Email and password validation
2. **Step 2**: Personal information (name, birthdate, gender)
3. **Admin bypass**: Direct creation for admin accounts

## Form Validation

### Email Validation
```javascript
import { validateEmail } from "../../utils/validation";

const validateStep1 = () => {
  if (!validateEmail(formData.email)) {
    newErrors.email = "Please enter a valid email address";
  }
};
```

### Password Security
```javascript
import { validatePassword } from "../../utils/validation";

// Password requirements
if (!validatePassword(formData.password)) {
  newErrors.password = "Password must be at least 6 characters";
}

// Confirmation matching
if (formData.password !== formData.confirmPassword) {
  newErrors.confirmPassword = "Passwords do not match";
}
```

### Personal Information Validation
```javascript
const validateStep2 = () => {
  const newErrors = {};
  
  if (!formData.name.trim()) {
    newErrors.name = "Name is required";
  }
  
  if (!formData.birthdate) {
    newErrors.birthdate = "Birth date is required";
  }
  
  if (!formData.gender) {
    newErrors.gender = "Gender is required";
  }
  
  return Object.keys(newErrors).length === 0;
};
```

## Component Architecture

### State Management
```javascript
const [step, setStep] = useState(1);
const [formData, setFormData] = useState({
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  birthdate: "",
  gender: ""
});
const [errors, setErrors] = useState({});
```

### Form Data Updates
```javascript
const updateFormData = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear field error on update
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: null }));
  }
};
```

### Step Navigation
```javascript
const handleNext = () => {
  if (validateStep1()) {
    if (isAdminEmail) {
      handleSubmit(); // Skip to submission for admin
    } else {
      setStep(2); // Move to personal info
    }
  }
};

const handleBack = () => {
  setStep(1);
  setErrors({});
};
```

## Form Types

### Login Form
```javascript
<AuthForm
  type="login"
  onSubmit={(data) => {
    // data: { email, password }
    signInWithEmail(data.email, data.password);
  }}
/>
```

### Registration Form
```javascript
<AuthForm
  type="register"
  onSubmit={(data) => {
    // data: { email, password, profileData?: { name, birthdate, gender } }
    createUserWithEmail(data);
  }}
/>
```

### Password Reset Form
```javascript
<AuthForm
  type="forgot-password"
  onSubmit={(data) => {
    // data: { email }
    sendPasswordResetEmail(data.email);
  }}
/>
```

## UI Components Integration

### Input Components
```javascript
<Input
  label="Email"
  placeholder="Enter your email"
  value={formData.email}
  onChangeText={(value) => updateFormData("email", value)}
  keyboardType="email-address"
  autoCapitalize="none"
  error={errors.email}
/>
```

### Date Picker Integration
```javascript
<DatePicker
  label="Birth Date"
  placeholder="Select birth date"
  value={formData.birthdate}
  onChange={(value) => updateFormData("birthdate", value)}
  maximumDate={maxDate} // 3 years ago
  minimumDate={minDate} // 100 years ago
  error={errors.birthdate}
/>
```

### Gender Selection
```javascript
<View style={styles.genderButtons}>
  <Button
    title="Male"
    onPress={() => updateFormData("gender", "male")}
    variant={formData.gender === "male" ? "primary" : "outline"}
  />
  <Button
    title="Female"
    onPress={() => updateFormData("gender", "female")}
    variant={formData.gender === "female" ? "primary" : "outline"}
  />
</View>
```

## Keyboard Handling

### Keyboard-Aware Scrolling
```javascript
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

<KeyboardAwareScrollView
  contentContainerStyle={styles.scrollContent}
  keyboardShouldPersistTaps="handled"
  enableOnAndroid={true}
  enableAutomaticScroll={true}
  extraScrollHeight={20}
>
  {/* Form content */}
</KeyboardAwareScrollView>
```

### Keyboard Dismissal
```javascript
import { TouchableWithoutFeedback, Keyboard } from "react-native";

<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={styles.container}>
    {/* Form content */}
  </View>
</TouchableWithoutFeedback>
```

## Error Handling

### Field-Level Errors
```javascript
// Display individual field errors
{errors.email && (
  <Text style={styles.errorText}>{errors.email}</Text>
)}
```

### Form-Level Validation
```javascript
const handleSubmit = () => {
  // Validate current step
  const isValid = step === 1 ? validateStep1() : validateStep2();
  
  if (!isValid) {
    return; // Stop submission if validation fails
  }
  
  // Proceed with submission
  onSubmit(formData);
};
```

## Loading States

### Form Loading
```javascript
if (loading) {
  return <LoadingSpinner text="Please wait..." />;
}
```

### Button Loading States
```javascript
<Button
  title={getButtonText()}
  onPress={handleSubmit}
  disabled={loading}
  loading={loading}
/>
```

## Accessibility

### Form Labels
```javascript
<Input
  label="Email" // Screen reader accessible
  placeholder="Enter your email"
  accessibilityLabel="Email input field"
  accessibilityHint="Enter your email address to sign in"
/>
```

### Button Accessibility
```javascript
<Button
  title="Sign In"
  accessibilityLabel="Sign in button"
  accessibilityHint="Tap to sign in to your account"
/>
```

## Development Guidelines

### Adding New Auth Components
1. **Follow form patterns** - Use consistent validation and state management
2. **Implement proper keyboard handling** - Use KeyboardAwareScrollView
3. **Add comprehensive validation** - Both client-side and server-side
4. **Support loading states** - Show progress during async operations
5. **Handle errors gracefully** - Display clear error messages
6. **Ensure accessibility** - Add proper labels and hints

### Form Validation Best Practices
- **Real-time feedback** - Clear errors when user starts typing
- **Progressive disclosure** - Show errors only after user interaction
- **Clear error messages** - Use user-friendly language
- **Field-specific validation** - Validate on blur for better UX

### Integration with Auth Services
```javascript
const handleRegistration = async (formData) => {
  try {
    const result = await createUserWithEmail(formData);
    if (result.success) {
      navigation.navigate('Dashboard');
    } else {
      setErrors({ submit: result.error });
    }
  } catch (error) {
    setErrors({ submit: 'Registration failed. Please try again.' });
  }
};
```

## Testing Considerations

### Unit Testing
- **Form validation** - Test all validation rules
- **Step navigation** - Test multi-step flow
- **Error handling** - Test error display and clearing
- **Admin account** - Test special admin flow
- **Form submission** - Test data structure

### Integration Testing
- **Auth service integration** - Test with actual auth calls
- **Navigation flow** - Test post-auth navigation
- **Error scenarios** - Test network failures
- **Keyboard behavior** - Test on different devices

### Accessibility Testing
- **Screen reader** - Test with VoiceOver/TalkBack
- **Keyboard navigation** - Test tab order
- **Focus management** - Test focus handling
- **Color contrast** - Test error message visibility