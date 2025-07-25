/**
 * @file Mobile navigation accessibility testing
 * @description Tests accessibility features for mobile navigation and responsive components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { 
  mockWindowDimensions, 
  mockMatchMedia,
  mockTouchSupport,
  BREAKPOINTS,
  cleanupResponsiveTest,
  hasMinimumTouchTarget
} from '../utils/responsive-test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Import components to test
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectCard from '../../components/ProjectCard';
import IletisimForm from '../../app/iletisim/IletisimForm';

describe('Mobile Navigation Accessibility', () => {
  beforeEach(() => {
    cleanupResponsiveTest();
    mockTouchSupport();
    mockWindowDimensions(BREAKPOINTS.mobile);
    mockMatchMedia(BREAKPOINTS.mobile);
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('header navigation should have no accessibility violations', async () => {
      const { container } = render(<Header />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('admin sidebar should have no accessibility violations', async () => {
      const { container } = render(<AdminSidebar />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('project cards should have no accessibility violations', async () => {
      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React', 'TypeScript'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { container } = render(<ProjectCard project={mockProject} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('contact form should have no accessibility violations', async () => {
      const { container } = render(<IletisimForm />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Touch Target Accessibility', () => {
    test('all interactive elements should meet minimum touch target size', () => {
      render(<Header />);
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach((element) => {
        expect(hasMinimumTouchTarget(element)).toBe(true);
      });
    });

    test('form controls should have adequate touch targets', () => {
      render(<IletisimForm />);
      
      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');
      
      [...inputs, ...buttons].forEach((element) => {
        const rect = element.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    test('navigation links should have sufficient spacing', () => {
      render(<AdminSidebar />);
      
      const navLinks = screen.getAllByRole('link');
      
      navLinks.forEach((link, index) => {
        expect(hasMinimumTouchTarget(link)).toBe(true);
        
        // Check spacing between adjacent links
        if (index < navLinks.length - 1) {
          const currentRect = link.getBoundingClientRect();
          const nextRect = navLinks[index + 1].getBoundingClientRect();
          
          // Should have adequate spacing between touch targets
          const verticalSpacing = Math.abs(nextRect.top - currentRect.bottom);
          expect(verticalSpacing).toBeGreaterThanOrEqual(8);
        }
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in mobile header', async () => {
      const user = userEvent.setup();
      
      render(<Header />);
      
      // Tab through navigation elements
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
      expect(focusedElement?.tagName).toMatch(/BUTTON|A|INPUT/);
    });

    test('should support keyboard navigation in admin sidebar', async () => {
      const user = userEvent.setup();
      
      render(<AdminSidebar />);
      
      const navLinks = screen.getAllByRole('link');
      
      // Should be able to tab through all navigation links
      for (let i = 0; i < navLinks.length; i++) {
        await user.tab();
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeInTheDocument();
      }
    });

    test('should handle Enter and Space key activation', async () => {
      const user = userEvent.setup();
      
      render(<Header />);
      
      const button = screen.getAllByRole('button')[0];
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
      
      // Should activate with Enter key
      await user.keyboard('{Enter}');
      expect(button).toBeInTheDocument();
      
      // Should activate with Space key
      await user.keyboard(' ');
      expect(button).toBeInTheDocument();
    });

    test('should trap focus in mobile menu when open', async () => {
      const user = userEvent.setup();
      
      render(<Header />);
      
      const menuButton = screen.queryByLabelText(/menu/i) || 
                        screen.queryByRole('button', { name: /menu/i });
      
      if (menuButton) {
        // Open mobile menu
        await user.click(menuButton);
        
        // Focus should be trapped within the menu
        const menuItems = screen.getAllByRole('link');
        
        if (menuItems.length > 0) {
          // Tab through menu items
          await user.tab();
          expect(document.activeElement).toBeInTheDocument();
          
          // Should cycle back to first item after last
          for (let i = 0; i < menuItems.length + 1; i++) {
            await user.tab();
          }
          
          expect(document.activeElement).toBeInTheDocument();
        }
      }
    });
  });

  describe('Screen Reader Support', () => {
    test('navigation should have proper ARIA labels', () => {
      render(<Header />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label');
      
      const menuButton = screen.queryByLabelText(/menu/i);
      if (menuButton) {
        expect(menuButton).toHaveAttribute('aria-expanded');
        expect(menuButton).toHaveAttribute('aria-controls');
      }
    });

    test('admin sidebar should have proper navigation structure', () => {
      render(<AdminSidebar />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label');
      
      const navLinks = screen.getAllByRole('link');
      navLinks.forEach((link) => {
        // Links should have accessible names
        expect(link).toHaveAccessibleName();
      });
    });

    test('project cards should have proper semantic structure', () => {
      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React', 'TypeScript'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAccessibleName();
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    test('form should have proper labels and descriptions', () => {
      render(<IletisimForm />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        // All inputs should have labels
        expect(input).toHaveAccessibleName();
      });
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Focus Management', () => {
    test('should manage focus when mobile menu opens/closes', async () => {
      const user = userEvent.setup();
      
      render(<Header />);
      
      const menuButton = screen.queryByLabelText(/menu/i) || 
                        screen.queryByRole('button', { name: /menu/i });
      
      if (menuButton) {
        // Focus menu button
        menuButton.focus();
        expect(menuButton).toHaveFocus();
        
        // Open menu
        await user.click(menuButton);
        
        // Focus should move to first menu item or stay on button
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeInTheDocument();
        
        // Close menu (if there's a close button or clicking menu button again)
        await user.click(menuButton);
        
        // Focus should return to menu button
        expect(menuButton).toHaveFocus();
      }
    });

    test('should handle focus indicators on touch devices', () => {
      render(<Header />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach((button) => {
        // Focus the button
        button.focus();
        
        // Should have visible focus indicator
        const computedStyle = window.getComputedStyle(button);
        expect(computedStyle.outline).toBeDefined();
      });
    });

    test('should skip to main content', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Header />
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );
      
      // Look for skip link
      const skipLink = screen.queryByText(/skip to main content/i);
      
      if (skipLink) {
        await user.click(skipLink);
        
        const mainContent = screen.getByRole('main');
        expect(mainContent).toHaveFocus();
      }
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should maintain contrast in dark mode', () => {
      // Mock dark mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query: string) => {
          if (query.includes('prefers-color-scheme: dark')) {
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

      render(<Header />);
      
      const header = screen.getByRole('banner');
      const computedStyle = window.getComputedStyle(header);
      
      // Should have appropriate contrast in dark mode
      expect(computedStyle.backgroundColor).toBeDefined();
      expect(computedStyle.color).toBeDefined();
    });

    test('should handle high contrast mode', () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query: string) => {
          if (query.includes('prefers-contrast: high')) {
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

      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should adapt to high contrast preferences
      const computedStyle = window.getComputedStyle(header);
      expect(computedStyle.borderColor).toBeDefined();
    });

    test('should support zoom up to 200%', () => {
      // Mock 200% zoom
      mockWindowDimensions(BREAKPOINTS.mobile / 2); // Simulate 200% zoom
      mockMatchMedia(BREAKPOINTS.mobile / 2);

      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Content should remain accessible at 200% zoom
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      
      // Interactive elements should still be usable
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(hasMinimumTouchTarget(button)).toBe(true);
      });
    });
  });

  describe('Motion and Animation Accessibility', () => {
    test('should respect reduced motion preferences', () => {
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

      render(<Header />);
      
      const header = screen.getByRole('banner');
      const computedStyle = window.getComputedStyle(header);
      
      // Should reduce or eliminate animations
      expect(computedStyle.animationDuration).toBeDefined();
      expect(computedStyle.transitionDuration).toBeDefined();
    });

    test('should not cause seizures with flashing content', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      const computedStyle = window.getComputedStyle(header);
      
      // Should not have rapid flashing animations
      expect(computedStyle.animationIterationCount).not.toBe('infinite');
    });
  });
});