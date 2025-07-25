/**
 * @file Responsive testing utilities for component testing
 * @description Provides utilities for testing responsive behavior, breakpoints, and mobile interactions
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Breakpoint definitions matching Tailwind CSS
export const BREAKPOINTS = {
  mobile: 375,
  mobileLarge: 414,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1280,
  wide: 1920,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Mock window.matchMedia for responsive testing
 */
export const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      // Parse media query to extract min-width or max-width
      const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
      const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);
      
      let matches = false;
      
      if (minWidthMatch) {
        const minWidth = parseInt(minWidthMatch[1]);
        matches = width >= minWidth;
      } else if (maxWidthMatch) {
        const maxWidth = parseInt(maxWidthMatch[1]);
        matches = width <= maxWidth;
      }
      
      return {
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
};

/**
 * Mock window dimensions for responsive testing
 */
export const mockWindowDimensions = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Mock screen dimensions as well
  Object.defineProperty(window, 'screen', {
    writable: true,
    configurable: true,
    value: {
      width,
      height,
      availWidth: width,
      availHeight: height,
    },
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

/**
 * Render component with specific viewport dimensions
 */
export const renderWithViewport = (
  ui: ReactElement,
  breakpoint: BreakpointName,
  options?: RenderOptions
) => {
  const width = BREAKPOINTS[breakpoint];
  
  // Mock window dimensions and matchMedia
  mockWindowDimensions(width);
  mockMatchMedia(width);
  
  return render(ui, options);
};

/**
 * Test component across multiple breakpoints
 */
export const testAcrossBreakpoints = (
  _component: ReactElement,
  testFn: (breakpoint: BreakpointName, width: number) => void,
  breakpoints: BreakpointName[] = ['mobile', 'tablet', 'desktop']
) => {
  breakpoints.forEach((breakpoint) => {
    const width = BREAKPOINTS[breakpoint];
    
    describe(`at ${breakpoint} breakpoint (${width}px)`, () => {
      beforeEach(() => {
        mockWindowDimensions(width);
        mockMatchMedia(width);
      });
      
      testFn(breakpoint, width);
    });
  });
};

/**
 * Mock touch events for mobile testing
 */
export const mockTouchSupport = () => {
  // Mock touch events
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    value: {},
  });
  
  // Mock navigator.maxTouchPoints
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    value: 5,
  });
  
  // Mock touch event constructors
  global.TouchEvent = class TouchEvent extends Event {
    touches: Touch[];
    targetTouches: Touch[];
    changedTouches: Touch[];
    
    constructor(type: string, eventInitDict?: TouchEventInit) {
      super(type, eventInitDict);
      this.touches = eventInitDict?.touches || [];
      this.targetTouches = eventInitDict?.targetTouches || [];
      this.changedTouches = eventInitDict?.changedTouches || [];
    }
  } as any;
  
  global.Touch = class Touch {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
    
    constructor(touchInit: TouchInit) {
      this.identifier = touchInit.identifier;
      this.target = touchInit.target;
      this.clientX = touchInit.clientX || 0;
      this.clientY = touchInit.clientY || 0;
      this.pageX = touchInit.pageX || touchInit.clientX || 0;
      this.pageY = touchInit.pageY || touchInit.clientY || 0;
      this.screenX = touchInit.screenX || touchInit.clientX || 0;
      this.screenY = touchInit.screenY || touchInit.clientY || 0;
    }
  } as any;
};

/**
 * Create a touch event for testing
 */
export const createTouchEvent = (
  type: string,
  touches: Array<{ clientX: number; clientY: number; target?: EventTarget }>
) => {
  const touchList = touches.map((touch, index) => new Touch({
    identifier: index,
    target: touch.target || document.body,
    clientX: touch.clientX,
    clientY: touch.clientY,
  }));
  
  return new TouchEvent(type, {
    touches: touchList,
    targetTouches: touchList,
    changedTouches: touchList,
    bubbles: true,
    cancelable: true,
  });
};

/**
 * Check if element has minimum touch target size (44px)
 */
export const hasMinimumTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // WCAG recommended minimum touch target size
  
  return rect.width >= minSize && rect.height >= minSize;
};

/**
 * Get computed styles for responsive testing
 */
export const getResponsiveStyles = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    display: computedStyle.display,
    flexDirection: computedStyle.flexDirection,
    gridTemplateColumns: computedStyle.gridTemplateColumns,
    width: computedStyle.width,
    height: computedStyle.height,
    padding: computedStyle.padding,
    margin: computedStyle.margin,
    fontSize: computedStyle.fontSize,
    lineHeight: computedStyle.lineHeight,
  };
};

/**
 * Mock CSS media queries for testing
 */
export const mockCSSMediaQueries = () => {
  // Mock CSS.supports for feature detection
  Object.defineProperty(window, 'CSS', {
    writable: true,
    value: {
      supports: jest.fn().mockImplementation((property: string, value?: string) => {
        // Mock support for common CSS features
        const supportedFeatures = [
          'display: grid',
          'display: flex',
          'backdrop-filter',
          'aspect-ratio',
          'container-queries',
        ];
        
        const query = value ? `${property}: ${value}` : property;
        return supportedFeatures.includes(query);
      }),
    },
  });
};

/**
 * Cleanup function for responsive tests
 */
export const cleanupResponsiveTest = () => {
  // Reset window dimensions
  try {
    delete (window as any).innerWidth;
    delete (window as any).innerHeight;
    delete (window as any).screen;
    delete (window as any).matchMedia;
    delete (window as any).ontouchstart;
  } catch (e) {
    // Some properties might not be configurable
  }
  
  // Reset navigator properties safely
  try {
    delete (navigator as any).maxTouchPoints;
  } catch (e) {
    // maxTouchPoints might not be configurable, just ignore
  }
  
  // Reset global constructors
  try {
    delete (global as any).TouchEvent;
    delete (global as any).Touch;
  } catch (e) {
    // Constructors might not be configurable
  }
};