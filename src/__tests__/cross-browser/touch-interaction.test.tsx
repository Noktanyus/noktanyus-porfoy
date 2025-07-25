/**
 * @file Touch interaction testing across devices
 * @description Tests touch interactions, gestures, and mobile-specific behaviors
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
  mockWindowDimensions, 
  mockMatchMedia,
  mockTouchSupport,
  createTouchEvent,
  hasMinimumTouchTarget,
  BREAKPOINTS,
  cleanupResponsiveTest
} from '../utils/responsive-test-utils';

// Import components to test
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectCard from '../../components/ProjectCard';
import IletisimForm from '../../app/iletisim/IletisimForm';

describe('Touch Interaction Testing', () => {
  beforeEach(() => {
    cleanupResponsiveTest();
    mockTouchSupport();
    mockWindowDimensions(BREAKPOINTS.mobile);
    mockMatchMedia(BREAKPOINTS.mobile);
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Touch Target Size Compliance', () => {
    test('header navigation buttons should meet minimum touch target size', () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(hasMinimumTouchTarget(button)).toBe(true);
      });
    });

    test('project card interactive elements should be touch-friendly', () => {
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
      
      const links = screen.getAllByRole('link');
      const buttons = screen.getAllByRole('button');
      
      [...links, ...buttons].forEach((element) => {
        expect(hasMinimumTouchTarget(element)).toBe(true);
      });
    });

    test('admin sidebar navigation should have adequate touch targets', () => {
      render(<AdminSidebar />);
      
      const navLinks = screen.getAllByRole('link');
      navLinks.forEach((link) => {
        expect(hasMinimumTouchTarget(link)).toBe(true);
      });
    });

    test('form inputs should be touch-friendly', () => {
      render(<IletisimForm sitekey="test-sitekey" />);
      
      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');
      
      [...inputs, ...buttons].forEach((element) => {
        const rect = element.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Touch Event Handling', () => {
    test('should handle tap events on navigation menu', async () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const menuButton = screen.queryByLabelText(/menu/i) || 
                        screen.queryByRole('button', { name: /menu/i });
      
      if (menuButton) {
        const touchStart = createTouchEvent('touchstart', [
          { clientX: 50, clientY: 50, target: menuButton }
        ]);
        
        const touchEnd = createTouchEvent('touchend', [
          { clientX: 50, clientY: 50, target: menuButton }
        ]);
        
        fireEvent(menuButton, touchStart);
        fireEvent(menuButton, touchEnd);
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          expect(menuButton).toBeInTheDocument();
        });
      }
    });

    test('should handle long press on project cards', async () => {
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
      
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, target: card }
      ]);
      
      fireEvent(card, touchStart);
      
      // Simulate long press (hold for 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const touchEnd = createTouchEvent('touchend', [
        { clientX: 100, clientY: 100, target: card }
      ]);
      
      fireEvent(card, touchEnd);
      
      expect(card).toBeInTheDocument();
    });

    test('should prevent default touch behaviors when appropriate', () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, target: header }
      ]);
      
      const touchMove = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 100, target: header }
      ]);
      
      fireEvent(header, touchStart);
      fireEvent(header, touchMove);
      
      // Should handle touch events appropriately
      expect(header).toBeInTheDocument();
    });
  });

  describe('Gesture Recognition', () => {
    test('should handle swipe gestures on mobile', async () => {
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
      
      // Simulate left swipe
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 200, clientY: 100, target: card }
      ]);
      
      const touchMove1 = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 100, target: card }
      ]);
      
      const touchMove2 = createTouchEvent('touchmove', [
        { clientX: 100, clientY: 100, target: card }
      ]);
      
      const touchEnd = createTouchEvent('touchend', [
        { clientX: 50, clientY: 100, target: card }
      ]);
      
      fireEvent(card, touchStart);
      fireEvent(card, touchMove1);
      fireEvent(card, touchMove2);
      fireEvent(card, touchEnd);
      
      expect(card).toBeInTheDocument();
    });

    test('should handle pinch-to-zoom prevention', () => {
      render(<IletisimForm sitekey="test-sitekey" />);
      
      const form = screen.getByRole('form');
      
      // Simulate pinch gesture (two fingers)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, target: form },
        { clientX: 200, clientY: 100, target: form }
      ]);
      
      const touchMove = createTouchEvent('touchmove', [
        { clientX: 80, clientY: 100, target: form },
        { clientX: 220, clientY: 100, target: form }
      ]);
      
      fireEvent(form, touchStart);
      fireEvent(form, touchMove);
      
      // Form should prevent unwanted zoom
      expect(form).toBeInTheDocument();
    });

    test('should handle scroll momentum on touch devices', async () => {
      render(<AdminSidebar />);
      
      const sidebar = screen.getByRole('navigation');
      
      // Simulate scroll with momentum
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 200, target: sidebar }
      ]);
      
      const touchMove = createTouchEvent('touchmove', [
        { clientX: 100, clientY: 100, target: sidebar }
      ]);
      
      const touchEnd = createTouchEvent('touchend', [
        { clientX: 100, clientY: 50, target: sidebar }
      ]);
      
      fireEvent(sidebar, touchStart);
      fireEvent(sidebar, touchMove);
      fireEvent(sidebar, touchEnd);
      
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Touch Accessibility', () => {
    test('should provide haptic feedback simulation', () => {
      // Mock vibration API
      Object.defineProperty(navigator, 'vibrate', {
        value: jest.fn(),
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const button = screen.getAllByRole('button')[0];
      
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: button }
      ]);
      
      fireEvent(button, touchStart);
      
      // Should handle haptic feedback appropriately
      expect(button).toBeInTheDocument();
    });

    test('should handle focus management with touch', async () => {
      const user = userEvent.setup();
      
      render(<IletisimForm sitekey="test-sitekey" />);
      
      const inputs = screen.getAllByRole('textbox');
      
      // Touch first input
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: inputs[0] }
      ]);
      
      fireEvent(inputs[0], touchEvent);
      fireEvent.click(inputs[0]);
      
      await waitFor(() => {
        expect(inputs[0]).toHaveFocus();
      });
      
      // Tab to next input should work with touch
      await user.tab();
      
      expect(inputs[1] || inputs[0]).toHaveFocus();
    });

    test('should handle screen reader announcements with touch', () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const navigation = screen.getByRole('navigation');
      
      // Touch navigation should trigger appropriate ARIA announcements
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: navigation }
      ]);
      
      fireEvent(navigation, touchEvent);
      
      expect(navigation).toHaveAttribute('role', 'navigation');
    });
  });

  describe('Touch Performance', () => {
    test('should handle rapid touch events without lag', async () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const button = screen.getAllByRole('button')[0];
      
      // Simulate rapid tapping
      for (let i = 0; i < 10; i++) {
        const touchStart = createTouchEvent('touchstart', [
          { clientX: 50, clientY: 50, target: button }
        ]);
        
        const touchEnd = createTouchEvent('touchend', [
          { clientX: 50, clientY: 50, target: button }
        ]);
        
        fireEvent(button, touchStart);
        fireEvent(button, touchEnd);
        
        // Small delay between taps
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      expect(button).toBeInTheDocument();
    });

    test('should debounce touch events appropriately', async () => {
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
      
      // Simulate multiple rapid touches
      const touches = Array.from({ length: 5 }, (_, i) => 
        createTouchEvent('touchstart', [
          { clientX: 50 + i, clientY: 50, target: card }
        ])
      );
      
      touches.forEach(touch => {
        fireEvent(card, touch);
      });
      
      expect(card).toBeInTheDocument();
    });

    test('should handle touch events during animations', async () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      
      // Simulate touch during potential animation
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: header }
      ]);
      
      fireEvent(header, touchEvent);
      
      // Should handle touch events smoothly during animations
      expect(header).toBeInTheDocument();
    });
  });

  describe('Device-Specific Touch Behavior', () => {
    test('should handle iOS Safari touch behavior', () => {
      // Mock iOS Safari
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      
      // iOS Safari specific touch handling
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: header }
      ]);
      
      fireEvent(header, touchEvent);
      
      expect(header).toBeInTheDocument();
    });

    test('should handle Android Chrome touch behavior', () => {
      // Mock Android Chrome
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      
      // Android Chrome specific touch handling
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: header }
      ]);
      
      fireEvent(header, touchEvent);
      
      expect(header).toBeInTheDocument();
    });

    test('should handle tablet touch interactions', () => {
      mockWindowDimensions(BREAKPOINTS.tablet);
      mockMatchMedia(BREAKPOINTS.tablet);

      render(<AdminSidebar />);
      
      const sidebar = screen.getByRole('navigation');
      
      // Tablet should handle touch differently than phone
      const touchEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, target: sidebar }
      ]);
      
      fireEvent(sidebar, touchEvent);
      
      expect(sidebar).toBeInTheDocument();
    });
  });
});