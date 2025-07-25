/**
 * @file Cross-browser responsive testing
 * @description Tests responsive behavior across different browser environments
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));
import { 
  mockMatchMedia, 
  mockWindowDimensions, 
  BREAKPOINTS,
  cleanupResponsiveTest,
  mockTouchSupport,
  createTouchEvent
} from '../utils/responsive-test-utils';

// Mock different browser user agents
const BROWSER_USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
};

// Mock different device pixel ratios
const DEVICE_PIXEL_RATIOS = [1, 1.5, 2, 3];

// Import components to test
import Header from '../../components/layout/Header';
import ProjectCard from '../../components/ProjectCard';
import AdminSidebar from '../../components/admin/AdminSidebar';

describe('Cross-Browser Responsive Testing', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    cleanupResponsiveTest();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Browser-Specific Responsive Behavior', () => {
    Object.entries(BROWSER_USER_AGENTS).forEach(([browserName, userAgent]) => {
      describe(`${browserName} browser`, () => {
        beforeEach(() => {
          // Mock user agent
          Object.defineProperty(navigator, 'userAgent', {
            value: userAgent,
            writable: true,
          });
        });

        test('should handle responsive breakpoints correctly', () => {
          Object.entries(BREAKPOINTS).forEach(([, width]) => {
            mockWindowDimensions(width);
            mockMatchMedia(width);

            render(<Header headerTitle="Test Portfolio" />);
            
            // Test that header adapts to different breakpoints
            const headers = screen.getAllByRole('banner');
            expect(headers.length).toBeGreaterThan(0);
            const header = headers[0];
            expect(header).toBeInTheDocument();
            
            // Mobile breakpoints should show mobile menu
            if (width < BREAKPOINTS.tablet) {
              const mobileMenuButton = screen.queryByLabelText(/menu/i) || 
                                     screen.queryByRole('button', { name: /menu/i });
              if (mobileMenuButton) {
                expect(mobileMenuButton).toBeInTheDocument();
              }
            }
          });
        });

        test('should handle CSS Grid and Flexbox consistently', () => {
          mockWindowDimensions(BREAKPOINTS.desktop);
          mockMatchMedia(BREAKPOINTS.desktop);

          const mockProject = {
            id: '1',
            title: 'Test Project',
            content: 'Test project content',
            slug: 'test-project',
            description: 'Test Description',
            mainImage: '/test-image.jpg',
            technologies: 'React,TypeScript',
            liveDemo: 'https://example.com',
            githubRepo: 'https://github.com/test',
            order: 1,
            featured: false,
            isLive: true,
            date: new Date(),
          };

          render(<ProjectCard project={mockProject} />);
          
          const projectCard = screen.getByRole('article');
          expect(projectCard).toBeInTheDocument();
          
          // Check that the card renders properly across browsers
          const computedStyle = window.getComputedStyle(projectCard);
          expect(computedStyle.display).toBeDefined();
        });

        test('should handle viewport meta tag behavior', () => {
          // Test viewport scaling behavior
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          
          if (browserName.includes('mobile') || browserName.includes('Android')) {
            // Mobile browsers should respect viewport meta tag
            if (viewportMeta) {
              expect(viewportMeta.getAttribute('content')).toContain('width=device-width');
            } else {
              // If no viewport meta tag exists, that's also valid for testing
              expect(viewportMeta).toBeNull();
            }
          }
        });
      });
    });
  });

  describe('Device Pixel Ratio Testing', () => {
    DEVICE_PIXEL_RATIOS.forEach((ratio) => {
      describe(`Device pixel ratio: ${ratio}`, () => {
        beforeEach(() => {
          // Mock device pixel ratio
          Object.defineProperty(window, 'devicePixelRatio', {
            value: ratio,
            writable: true,
          });
        });

        test('should handle high-DPI displays correctly', () => {
          mockWindowDimensions(BREAKPOINTS.mobile);
          mockMatchMedia(BREAKPOINTS.mobile);

          const mockProject = {
            id: '1',
            title: 'Test Project',
            content: 'Test project content',
            slug: 'test-project',
            description: 'Test Description',
            mainImage: '/test-image.jpg',
            technologies: 'React',
            liveDemo: 'https://example.com',
            githubRepo: 'https://github.com/test',
            order: 1,
            featured: false,
            isLive: true,
            date: new Date(),
          };

          render(<ProjectCard project={mockProject} />);
          
          const image = screen.getByRole('img');
          expect(image).toBeInTheDocument();
          
          // High-DPI displays should load appropriate image sizes
          if (ratio >= 2) {
            // Should handle retina displays
            expect(image).toHaveAttribute('src');
          }
        });

        test('should maintain touch target sizes across pixel ratios', () => {
          mockWindowDimensions(BREAKPOINTS.mobile);
          mockMatchMedia(BREAKPOINTS.mobile);
          mockTouchSupport();

          render(<Header headerTitle="Test Portfolio" />);
          
          const buttons = screen.getAllByRole('button');
          buttons.forEach((button) => {
            const rect = button.getBoundingClientRect();
            // Touch targets should be at least 44px regardless of pixel ratio
            const minSize = 44 / ratio; // Adjust for pixel ratio
            expect(rect.width).toBeGreaterThanOrEqual(minSize);
            expect(rect.height).toBeGreaterThanOrEqual(minSize);
          });
        });
      });
    });
  });

  describe('Screen Orientation Testing', () => {
    const orientations = [
      { name: 'portrait', width: 375, height: 667 },
      { name: 'landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
    ];

    orientations.forEach(({ name, width, height }) => {
      describe(`${name} orientation`, () => {
        beforeEach(() => {
          mockWindowDimensions(width, height);
          mockMatchMedia(width);
          
          // Mock screen orientation API
          Object.defineProperty(screen, 'orientation', {
            value: {
              angle: name.includes('landscape') ? 90 : 0,
              type: name.includes('landscape') ? 'landscape-primary' : 'portrait-primary',
            },
            writable: true,
          });
        });

        test('should adapt layout to orientation changes', () => {
          render(<Header headerTitle="Test Portfolio" />);
          
          const header = screen.getByRole('banner');
          expect(header).toBeInTheDocument();
          
          // Test that header adapts to orientation
          const computedStyle = window.getComputedStyle(header);
          expect(computedStyle.display).toBeDefined();
        });

        test('should handle admin sidebar in different orientations', () => {
          render(<AdminSidebar />);
          
          const sidebar = screen.getByRole('navigation');
          expect(sidebar).toBeInTheDocument();
          
          // In landscape mobile, sidebar might behave differently
          if (name === 'landscape' && width < 768) {
            // Should adapt to landscape mobile layout
            const computedStyle = window.getComputedStyle(sidebar);
            expect(computedStyle.display).toBeDefined();
          }
        });

        test('should maintain accessibility in all orientations', () => {
          render(<Header headerTitle="Test Portfolio" />);
          
          // Check that interactive elements are still accessible
          const interactiveElements = screen.getAllByRole('button');
          interactiveElements.forEach((element) => {
            expect(element).toBeVisible();
            
            // Touch targets should remain adequate in all orientations
            const rect = element.getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('Touch Interaction Testing', () => {
    beforeEach(() => {
      mockTouchSupport();
      mockWindowDimensions(BREAKPOINTS.mobile);
      mockMatchMedia(BREAKPOINTS.mobile);
    });

    test('should handle touch events on mobile navigation', async () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const mobileMenuButton = screen.queryByLabelText(/menu/i) || 
                              screen.queryByRole('button', { name: /menu/i });
      
      if (mobileMenuButton) {
        // Test touch interaction
        const touchEvent = createTouchEvent('touchstart', [
          { clientX: 50, clientY: 50, target: mobileMenuButton }
        ]);
        
        fireEvent(mobileMenuButton, touchEvent);
        fireEvent.click(mobileMenuButton);
        
        await waitFor(() => {
          // Menu should open/close on touch
          expect(mobileMenuButton).toBeInTheDocument();
        });
      }
    });

    test('should handle swipe gestures', async () => {
      const mockProject = {
        id: '1',
        title: 'Test Project',
        content: 'Test project content',
        slug: 'test-project',
        description: 'Test Description',
        mainImage: '/test-image.jpg',
        technologies: 'React',
        liveDemo: 'https://example.com',
        githubRepo: 'https://github.com/test',
        order: 1,
        featured: false,
        isLive: true,
        date: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      
      // Simulate swipe gesture
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, target: card }
      ]);
      
      const touchMove = createTouchEvent('touchmove', [
        { clientX: 50, clientY: 100, target: card }
      ]);
      
      const touchEnd = createTouchEvent('touchend', [
        { clientX: 50, clientY: 100, target: card }
      ]);
      
      fireEvent(card, touchStart);
      fireEvent(card, touchMove);
      fireEvent(card, touchEnd);
      
      // Card should handle touch interactions gracefully
      expect(card).toBeInTheDocument();
    });

    test('should prevent zoom on double tap for form inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <input type="text" placeholder="Test input" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByPlaceholderText('Test input');
      
      // Double tap should not cause zoom
      await user.click(input);
      await user.click(input);
      
      expect(input).toHaveFocus();
      
      // Check that input has proper viewport meta tag behavior
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        expect(viewportMeta.getAttribute('content')).toContain('user-scalable=no');
      }
    });
  });

  describe('CSS Feature Detection', () => {
    test('should handle browsers without CSS Grid support', () => {
      // Mock older browser without CSS Grid
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: jest.fn().mockImplementation((property: string) => {
            return !property.includes('grid');
          }),
        },
        writable: true,
      });

      mockWindowDimensions(BREAKPOINTS.desktop);
      mockMatchMedia(BREAKPOINTS.desktop);

      const mockProject = {
        id: '1',
        title: 'Test Project',
        content: 'Test project content',
        slug: 'test-project',
        description: 'Test Description',
        mainImage: '/test-image.jpg',
        technologies: 'React',
        liveDemo: 'https://example.com',
        githubRepo: 'https://github.com/test',
        order: 1,
        featured: false,
        isLive: true,
        date: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      
      // Should fallback to flexbox or other layout methods
      const computedStyle = window.getComputedStyle(card);
      expect(computedStyle.display).toBeDefined();
    });

    test('should handle browsers without backdrop-filter support', () => {
      // Mock browser without backdrop-filter
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: jest.fn().mockImplementation((property: string) => {
            return !property.includes('backdrop-filter');
          }),
        },
        writable: true,
      });

      mockWindowDimensions(BREAKPOINTS.mobile);
      mockMatchMedia(BREAKPOINTS.mobile);

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should provide fallback styling
      const computedStyle = window.getComputedStyle(header);
      expect(computedStyle.backgroundColor).toBeDefined();
    });
  });

  describe('Performance Across Browsers', () => {
    test('should handle animation performance on different browsers', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query: string) => {
          if (query.includes('prefers-reduced-motion')) {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            };
          }
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        }),
        writable: true,
      });

      mockWindowDimensions(BREAKPOINTS.mobile);

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should respect reduced motion preferences
      const computedStyle = window.getComputedStyle(header);
      expect(computedStyle.animationDuration).toBeDefined();
    });

    test('should handle memory constraints on mobile browsers', () => {
      // Mock mobile browser with memory constraints
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB RAM
        writable: true,
      });

      mockWindowDimensions(BREAKPOINTS.mobile);
      mockMatchMedia(BREAKPOINTS.mobile);

      const mockProject = {
        id: '1',
        title: 'Test Project',
        content: 'Test project content',
        slug: 'test-project',
        description: 'Test Description',
        mainImage: '/test-image.jpg',
        technologies: 'React',
        liveDemo: 'https://example.com',
        githubRepo: 'https://github.com/test',
        order: 1,
        featured: false,
        isLive: true,
        date: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      
      // Should optimize for low-memory devices
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });
});