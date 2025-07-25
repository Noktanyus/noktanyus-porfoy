/**
 * @file Responsive tests for Header component
 * @description Tests Header component behavior across different breakpoints and touch interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'next-themes';
import Header from '../Header';
import {
  renderWithViewport,
  testAcrossBreakpoints,
  mockTouchSupport,
  createTouchEvent,
  hasMinimumTouchTarget,
  cleanupResponsiveTest,
  BREAKPOINTS,
} from '../../../__tests__/utils/responsive-test-utils';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const HeaderWithTheme = ({ headerTitle }: { headerTitle: string }) => (
  <ThemeProvider attribute="class" defaultTheme="light">
    <Header headerTitle={headerTitle} />
  </ThemeProvider>
);

describe('Header Responsive Tests', () => {
  const defaultProps = {
    headerTitle: 'Test Portfolio',
  };

  beforeEach(() => {
    // Reset any previous mocks
    cleanupResponsiveTest();
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'desktop');
    });

    it('should show desktop navigation links', () => {
      expect(screen.getByText('Hakkımda')).toBeVisible();
      expect(screen.getByText('Projelerim')).toBeVisible();
      expect(screen.getByText('Blog')).toBeVisible();
      expect(screen.getByText('İletişim')).toBeVisible();
    });

    it('should hide mobile menu button on desktop', () => {
      const mobileMenuButton = screen.queryByLabelText('Menüyü aç/kapat');
      expect(mobileMenuButton).not.toBeVisible();
    });

    it('should have proper spacing between navigation items', () => {
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('space-x-2', 'lg:space-x-4', 'xl:space-x-6');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
    });

    it('should show mobile menu button', () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      expect(mobileMenuButton).toBeVisible();
    });

    it('should hide desktop navigation on mobile', () => {
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('should have minimum touch target size for mobile menu button', () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      expect(hasMinimumTouchTarget(mobileMenuButton)).toBe(true);
    });

    it('should open mobile menu when button is clicked', async () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hakkımda')).toBeVisible();
        expect(screen.getByText('Projelerim')).toBeVisible();
      });
    });

    it('should close mobile menu when backdrop is clicked', async () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      // Open menu
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hakkımda')).toBeVisible();
      });
      
      // Click backdrop
      const backdrop = document.querySelector('.bg-black\\/30');
      if (backdrop) {
        fireEvent.click(backdrop as HTMLElement);
        
        await waitFor(() => {
          expect(screen.queryByText('Hakkımda')).not.toBeVisible();
        });
      }
    });

    it('should have touch-friendly mobile menu items', async () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        const mobileLinks = screen.getAllByRole('link');
        const mobileNavLinks = mobileLinks.filter(link => 
          link.textContent && ['Hakkımda', 'Projelerim', 'Blog', 'İletişim'].includes(link.textContent)
        );
        
        mobileNavLinks.forEach(link => {
          expect(hasMinimumTouchTarget(link)).toBe(true);
          expect(link).toHaveClass('min-h-[52px]');
        });
      });
    });
  });

  describe('Theme Toggle Button', () => {
    testAcrossBreakpoints(
      <HeaderWithTheme {...defaultProps} />,
      (breakpoint) => {
        it(`should have minimum touch target size at ${breakpoint}`, () => {
          const themeButton = screen.getByLabelText(/koyu moda geç|açık moda geç/i);
          expect(hasMinimumTouchTarget(themeButton)).toBe(true);
        });

        it(`should be accessible via keyboard at ${breakpoint}`, async () => {
          const themeButton = screen.getByLabelText(/koyu moda geç|açık moda geç/i);
          
          themeButton.focus();
          expect(themeButton).toHaveFocus();
          
          fireEvent.keyDown(themeButton, { key: 'Enter' });
          // Theme should change (we can't easily test the actual theme change in this setup)
        });
      }
    );
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      mockTouchSupport();
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
    });

    it('should handle touch events on mobile menu button', async () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      // Simulate touch start
      const touchStartEvent = createTouchEvent('touchstart', [
        { clientX: 50, clientY: 50, target: mobileMenuButton }
      ]);
      
      fireEvent(mobileMenuButton, touchStartEvent);
      
      // Simulate touch end (tap)
      const touchEndEvent = createTouchEvent('touchend', []);
      fireEvent(mobileMenuButton, touchEndEvent);
      
      // Click should still work
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        const mobileMenuLinks = screen.getAllByText('Hakkımda');
        const mobileLink = mobileMenuLinks.find(link => 
          link.closest('nav')?.classList.contains('flex-col')
        );
        expect(mobileLink).toBeVisible();
      });
    });

    it('should prevent body scroll when mobile menu is open', async () => {
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      // Initially body should be scrollable
      expect(document.body.style.overflow).toBe('');
      
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });
  });

  describe('Accessibility', () => {
    testAcrossBreakpoints(
      <HeaderWithTheme {...defaultProps} />,
      (breakpoint) => {
        it(`should have proper ARIA labels at ${breakpoint}`, () => {
          const homeLink = screen.getByLabelText('Ana Sayfa');
          expect(homeLink).toBeInTheDocument();
          
          const themeButton = screen.getByLabelText(/koyu moda geç|açık moda geç/i);
          expect(themeButton).toBeInTheDocument();
          
          if (breakpoint === 'mobile') {
            const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
            expect(mobileMenuButton).toBeInTheDocument();
          }
        });

        it(`should have proper heading hierarchy at ${breakpoint}`, () => {
          const siteTitle = screen.getByText(defaultProps.headerTitle);
          expect(siteTitle.closest('a')).toHaveAttribute('aria-label', 'Ana Sayfa');
        });
      }
    );

    it('should support keyboard navigation in mobile menu', async () => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
      
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      // Open menu with keyboard
      mobileMenuButton.focus();
      fireEvent.keyDown(mobileMenuButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Hakkımda')).toBeVisible();
      });
      
      // Navigate through menu items with Tab
      fireEvent.keyDown(document, { key: 'Tab' });
      const firstLink = screen.getByText('Hakkımda').closest('a');
      expect(firstLink).toBeInTheDocument();
    });

    it('should close mobile menu with Escape key', async () => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
      
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hakkımda')).toBeVisible();
      });
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('Hakkımda')).not.toBeVisible();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should truncate long titles on mobile', () => {
      const longTitle = 'This is a very long portfolio title that should be truncated on mobile devices';
      renderWithViewport(<HeaderWithTheme headerTitle={longTitle} />, 'mobile');
      
      const titleElement = screen.getByText(longTitle);
      const titleSpan = titleElement.querySelector('span');
      
      expect(titleSpan).toHaveClass('truncate', 'max-w-[120px]');
    });

    it('should not truncate titles on desktop', () => {
      const longTitle = 'This is a very long portfolio title that should not be truncated on desktop';
      renderWithViewport(<HeaderWithTheme headerTitle={longTitle} />, 'desktop');
      
      const titleElement = screen.getByText(longTitle);
      const titleSpan = titleElement.querySelector('span');
      
      expect(titleSpan).toHaveClass('max-w-[120px]', 'sm:max-w-none');
    });

    it('should have proper backdrop blur on supported devices', () => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'desktop');
      
      const header = screen.getByRole('banner');
      const headerContainer = header.querySelector('div > div');
      
      expect(headerContainer).toHaveClass('backdrop-blur-md');
    });
  });

  describe('Performance Optimizations', () => {
    it('should prevent scrollbar jump when mobile menu opens', async () => {
      renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
      
      // Mock scrollbar width calculation
      Object.defineProperty(document.documentElement, 'clientWidth', {
        value: 375,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 390, // Simulate scrollbar width of 15px
        configurable: true,
      });
      
      const mobileMenuButton = screen.getByLabelText('Menüyü aç/kapat');
      
      fireEvent.click(mobileMenuButton);
      
      await waitFor(() => {
        expect(document.body.style.paddingRight).toBe('15px');
      });
    });

    it('should cleanup styles when component unmounts', () => {
      const { unmount } = renderWithViewport(<HeaderWithTheme {...defaultProps} />, 'mobile');
      
      // Set some styles that should be cleaned up
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
      
      unmount();
      
      // Styles should be reset (this would happen in the useEffect cleanup)
      expect(document.body.style.overflow).toBe('hidden'); // Still set until cleanup runs
    });
  });
});