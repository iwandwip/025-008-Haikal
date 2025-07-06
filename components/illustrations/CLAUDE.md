# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the `/components/illustrations` directory.

## Directory Overview

The `/components/illustrations` directory contains SVG illustrations and graphic components for the Smart Bisyaroh system. These components provide visual context and enhance the user experience across authentication flows and educational content.

## Illustration Components

### Available Illustrations
- **`LoginIllustration.jsx`** - Visual element for login screens
- **`RegisterIllustration.jsx`** - Graphic for registration workflow
- **`ForgotPasswordIllustration.jsx`** - Visual for password reset screens
- **`index.js`** - Centralized export for all illustrations

## Key Features

### Responsive Illustration Component
All illustrations follow a consistent pattern for responsive rendering:

```javascript
const LoginIllustration = ({ 
  width = 280, 
  height = 200, 
  style 
}) => {
  return (
    <View style={[styles.container, style, { width, height }]}>
      <Image
        source={require("../../assets/images/login.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};
```

### Centralized Exports
```javascript
// index.js - Clean import structure
export { default as LoginIllustration } from './LoginIllustration';
export { default as RegisterIllustration } from './RegisterIllustration';
export { default as ForgotPasswordIllustration } from './ForgotPasswordIllustration';

// Usage in components
import { LoginIllustration } from '../../components/illustrations';
```

## Design Principles

### TPQ-Themed Graphics
Illustrations are designed specifically for Islamic religious school context:
- **Cultural relevance** - Islamic educational themes
- **Age-appropriate** - Suitable for parents and children
- **Professional appearance** - Clean, modern design
- **Consistent style** - Unified visual language

### Responsive Design
```javascript
// Flexible sizing
<LoginIllustration 
  width={screenWidth * 0.8}
  height={200}
  style={customStyle}
/>

// Adaptive to screen sizes
const getIllustrationSize = () => {
  const { width } = Dimensions.get('window');
  return {
    width: Math.min(width * 0.8, 320),
    height: 200
  };
};
```

### Performance Optimization
- **Image optimization** - Proper compression and sizing
- **Lazy loading** - Load only when needed
- **Caching** - Efficient image caching
- **Format selection** - PNG for complex images, SVG for simple graphics

## Component Architecture

### Standard Illustration Pattern
```javascript
const IllustrationComponent = ({ 
  width = defaultWidth, 
  height = defaultHeight, 
  style,
  tintColor,
  opacity = 1 
}) => {
  return (
    <View style={[
      styles.container, 
      style, 
      { width, height, opacity }
    ]}>
      <Image
        source={require("../../assets/images/illustration.png")}
        style={[
          styles.image,
          tintColor && { tintColor }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};
```

### Style Consistency
```javascript
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
```

## Usage Patterns

### Authentication Screens
```javascript
import { LoginIllustration } from '../../components/illustrations';

const LoginScreen = () => (
  <View style={styles.container}>
    <LoginIllustration 
      width={280}
      height={200}
      style={styles.illustration}
    />
    <AuthForm type="login" />
  </View>
);
```

### Registration Flow
```javascript
import { RegisterIllustration } from '../../components/illustrations';

const RegisterScreen = () => (
  <ScrollView>
    <RegisterIllustration />
    <AuthForm type="register" />
  </ScrollView>
);
```

### Password Reset
```javascript
import { ForgotPasswordIllustration } from '../../components/illustrations';

const ForgotPasswordScreen = () => (
  <View>
    <ForgotPasswordIllustration 
      style={styles.centeredIllustration}
    />
    <AuthForm type="forgot-password" />
  </View>
);
```

## Asset Management

### Image Assets
```
assets/
├── images/
│   ├── login.png          # Login screen illustration
│   ├── register.png       # Registration illustration
│   ├── forgot-password.png # Password reset illustration
│   └── app-icon.png       # App icon and branding
```

### Asset Requirements
- **High resolution** - Support for 2x and 3x densities
- **Consistent style** - Unified visual design
- **Optimized size** - Compressed for performance
- **Cultural sensitivity** - Appropriate for Islamic context

## Integration with UI Components

### IllustrationContainer Integration
```javascript
import IllustrationContainer from '../ui/IllustrationContainer';
import { LoginIllustration } from '../illustrations';

const LoginHeader = () => (
  <IllustrationContainer>
    <LoginIllustration />
  </IllustrationContainer>
);
```

### Theme Integration
```javascript
const ThemedIllustration = () => {
  const { isAdmin } = useAuth();
  const theme = getThemeByRole(isAdmin);
  
  return (
    <LoginIllustration 
      tintColor={theme.primary}
      style={{ opacity: theme.illustrationOpacity }}
    />
  );
};
```

## Development Guidelines

### Creating New Illustrations
1. **Design consistency** - Follow existing visual style
2. **Cultural appropriateness** - Suitable for TPQ context
3. **Performance** - Optimize image size and format
4. **Responsive sizing** - Support flexible dimensions
5. **Accessibility** - Add proper alt text and descriptions

### Asset Preparation
```javascript
// Optimal image specifications
const assetSpecs = {
  format: 'PNG', // For complex illustrations
  maxWidth: 400,
  maxHeight: 300,
  compression: 0.8,
  densities: ['1x', '2x', '3x']
};
```

### Component Template
```javascript
import React from "react";
import { View, Image, StyleSheet } from "react-native";

const NewIllustration = ({ 
  width = 280, 
  height = 200, 
  style,
  tintColor,
  opacity = 1 
}) => {
  return (
    <View style={[
      styles.container, 
      style, 
      { width, height, opacity }
    ]}>
      <Image
        source={require("../../assets/images/new-illustration.png")}
        style={[
          styles.image,
          tintColor && { tintColor }
        ]}
        resizeMode="contain"
        accessibilityLabel="Description of illustration"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default NewIllustration;
```

## Accessibility Considerations

### Screen Reader Support
```javascript
<Image
  source={require("../../assets/images/login.png")}
  style={styles.image}
  accessibilityLabel="Login illustration showing a mobile phone and user icon"
  accessibilityRole="image"
/>
```

### High Contrast Support
```javascript
const getAccessibleStyle = () => {
  const { isHighContrast } = useAccessibility();
  return {
    opacity: isHighContrast ? 0.9 : 1,
    filter: isHighContrast ? 'contrast(1.2)' : 'none'
  };
};
```

## Performance Optimization

### Image Caching
```javascript
// Preload critical illustrations
const preloadIllustrations = () => {
  Image.prefetch(require("../../assets/images/login.png"));
  Image.prefetch(require("../../assets/images/register.png"));
};
```

### Bundle Size Management
- **Conditional loading** - Load only needed illustrations
- **Image optimization** - Proper compression
- **Format selection** - SVG for simple graphics, PNG for complex
- **Asset bundling** - Group related illustrations

## Testing Guidelines

### Visual Testing
- **Screenshot comparisons** - Ensure consistent rendering
- **Device testing** - Test on various screen sizes
- **Accessibility testing** - Screen reader compatibility
- **Performance testing** - Load time optimization

### Integration Testing
- **Component rendering** - Test with different props
- **Theme integration** - Test with both admin and wali themes
- **Responsive behavior** - Test size adaptations
- **Error handling** - Test missing asset scenarios

## Cultural Considerations

### Islamic Context
- **Respectful imagery** - Appropriate for religious environment
- **Educational themes** - Relevant to learning context
- **Family-friendly** - Suitable for all ages
- **Professional appearance** - Maintains institutional credibility

### Localization Support
- **Text-free designs** - Universal visual language
- **Cultural symbols** - Appropriate Islamic motifs
- **Color sensitivity** - Culturally appropriate color choices
- **Directional considerations** - RTL language support if needed