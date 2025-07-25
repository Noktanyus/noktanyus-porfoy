# Responsive Testing Suite

This comprehensive testing suite ensures that all components work correctly across different screen sizes, breakpoints, and interaction methods. It covers responsive behavior, visual consistency, accessibility compliance, and touch interactions.

## 📋 Test Categories

### 1. Responsive Unit Tests (`*.responsive.test.tsx`)
Tests component behavior across different breakpoints and screen sizes.

**Coverage:**
- Layout changes at different breakpoints
- Content adaptation (text wrapping, truncation)
- Image sizing and aspect ratios
- Button and interactive element sizing
- Grid and flexbox behavior
- Typography scaling

**Key Components Tested:**
- `Header` - Mobile menu, navigation, theme toggle
- `ProjectCard` - Layout switching, content overflow
- `AdminSidebar` - Mobile drawer, desktop sidebar

### 2. Visual Regression Tests (`visual/*.test.tsx`)
Snapshot testing to ensure visual consistency across breakpoints.

**Coverage:**
- Component rendering at all breakpoints
- Dark/light theme variations
- Loading and error states
- Layout combinations
- Edge cases (very narrow/wide screens)

### 3. Accessibility Tests (`accessibility/*.test.tsx`)
WCAG 2.1 AA compliance testing for mobile and desktop.

**Coverage:**
- ARIA attributes and labels
- Keyboard navigation
- Focus management and trapping
- Screen reader announcements
- Touch target sizes (minimum 44px)
- Color contrast
- Semantic HTML structure

### 4. Touch Interaction Tests
Testing touch-specific functionality and gestures.

**Coverage:**
- Touch event handling
- Gesture recognition
- Touch target accessibility
- Mobile-specific interactions
- Performance on touch devices

## 🚀 Running Tests

### Run All Responsive Tests
```bash
npm run test:responsive
```

### Run Specific Test Categories
```bash
# Unit tests only
npm run test:responsive:unit

# Visual regression tests only
npm run test:responsive:visual

# Accessibility tests only
npm run test:responsive:a11y

# Touch interaction tests only
npm run test:responsive:touch
```

### Run Individual Test Files
```bash
# Specific component responsive tests
npm test -- Header.responsive.test.tsx

# Specific accessibility tests
npm test -- mobile-navigation.test.tsx

# Visual regression tests
npm test -- visual-regression.test.tsx
```

## 📊 Test Reports

The test runner generates comprehensive reports in `test-results/responsive/`:

- **JSON Report** (`responsive-test-report.json`) - Machine-readable results
- **HTML Report** (`responsive-test-report.html`) - Human-readable dashboard

### Report Features
- Test suite summary with pass/fail counts
- Detailed results for each test configuration
- Performance metrics and duration tracking
- Test output and error details
- Visual dashboard with charts and graphs

## 🛠 Test Utilities

### `responsive-test-utils.ts`
Comprehensive utilities for responsive testing:

```typescript
// Render component at specific breakpoint
renderWithViewport(<Component />, 'mobile');

// Test across multiple breakpoints
testAcrossBreakpoints(<Component />, (breakpoint) => {
  // Test logic for each breakpoint
});

// Mock touch support
mockTouchSupport();

// Create touch events
const touchEvent = createTouchEvent('touchstart', [
  { clientX: 100, clientY: 100 }
]);

// Check minimum touch target size
hasMinimumTouchTarget(element); // Returns boolean

// Mock window dimensions
mockWindowDimensions(375, 667); // iPhone dimensions
```

### Breakpoint Definitions
```typescript
const BREAKPOINTS = {
  mobile: 375,        // iPhone SE
  mobileLarge: 414,   // iPhone Plus
  tablet: 768,        // iPad
  desktop: 1024,      // Desktop
  desktopLarge: 1280, // Large desktop
  wide: 1920,         // Wide screen
};
```

## 📱 Mobile-First Testing Approach

All tests follow a mobile-first methodology:

1. **Start with mobile** - Test smallest screen first
2. **Progressive enhancement** - Verify features work as screen size increases
3. **Touch-first interactions** - Prioritize touch over hover
4. **Performance considerations** - Test on constrained mobile environments

## ♿ Accessibility Testing Standards

### WCAG 2.1 AA Compliance
- **Perceivable** - Content must be presentable to users in ways they can perceive
- **Operable** - Interface components must be operable
- **Understandable** - Information and UI operation must be understandable
- **Robust** - Content must be robust enough for various assistive technologies

### Key Accessibility Checks
- Minimum touch target size (44px × 44px)
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast ratios
- Semantic HTML structure
- ARIA labels and descriptions

## 🎯 Testing Best Practices

### Component Testing
```typescript
describe('Component Responsive Tests', () => {
  beforeEach(() => {
    cleanupResponsiveTest(); // Clean up previous test state
  });

  testAcrossBreakpoints(
    <Component />,
    (breakpoint) => {
      it(`should behave correctly at ${breakpoint}`, () => {
        // Test logic
      });
    }
  );
});
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Touch Testing
```typescript
beforeEach(() => {
  mockTouchSupport();
});

it('should handle touch interactions', () => {
  const touchEvent = createTouchEvent('touchstart', [
    { clientX: 50, clientY: 50 }
  ]);
  
  fireEvent(element, touchEvent);
  // Assert expected behavior
});
```

## 🔧 Configuration

### Jest Configuration
The responsive tests use the existing Jest configuration with additional setup:

```javascript
// jest.setup.js
require('@testing-library/jest-dom');

// Additional setup for responsive tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### TypeScript Configuration
Ensure proper types are available:

```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom", "jest-axe"]
  }
}
```

## 📈 Performance Considerations

### Test Performance
- Use `renderWithViewport` instead of multiple renders
- Clean up test state with `cleanupResponsiveTest`
- Mock heavy dependencies (images, animations)
- Use snapshot testing for visual regression

### Component Performance
- Test animation performance on mobile
- Verify lazy loading behavior
- Check bundle size impact
- Test memory usage patterns

## 🐛 Debugging Tests

### Common Issues
1. **Viewport not updating** - Ensure `mockWindowDimensions` is called
2. **Touch events not working** - Call `mockTouchSupport` in beforeEach
3. **Accessibility violations** - Check ARIA attributes and semantic HTML
4. **Snapshot mismatches** - Update snapshots with `npm test -- -u`

### Debug Utilities
```typescript
// Log current viewport
console.log('Viewport:', window.innerWidth, window.innerHeight);

// Log element styles
console.log('Styles:', getResponsiveStyles(element));

// Check touch support
console.log('Touch support:', 'ontouchstart' in window);
```

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest Axe Documentation](https://github.com/nickcolley/jest-axe)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/responsive)

## 🤝 Contributing

When adding new responsive components:

1. Create responsive unit tests
2. Add visual regression tests
3. Include accessibility tests
4. Test touch interactions
5. Update this documentation

### Test Naming Convention
- `ComponentName.responsive.test.tsx` - Responsive behavior tests
- `ComponentName.accessibility.test.tsx` - Accessibility-specific tests
- `ComponentName.visual.test.tsx` - Visual regression tests
- `ComponentName.touch.test.tsx` - Touch interaction tests