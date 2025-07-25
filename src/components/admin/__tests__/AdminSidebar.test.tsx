/**
 * @file AdminSidebar bileşeni için responsive davranış testleri
 * @description Bu test dosyası AdminSidebar bileşeninin mobil ve desktop
 *              responsive davranışlarını, touch-friendly navigation özelliklerini
 *              ve drawer pattern implementasyonunu test eder.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import AdminSidebar from '../AdminSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
});

describe('AdminSidebar Responsive Behavior', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/admin/dashboard');
    mockConfirm.mockClear();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    // Clean up body styles after each test
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
  });

  describe('Mobile Drawer Pattern', () => {
    test('hamburger menu button should be visible on mobile', () => {
      render(<AdminSidebar />);
      
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveClass('lg:hidden');
    });

    test('sidebar should be hidden by default on mobile', () => {
      render(<AdminSidebar />);
      
      const sidebar = document.getElementById('admin-sidebar');
      expect(sidebar).toHaveClass('-translate-x-full');
      expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });

    test('clicking hamburger button should open mobile menu', async () => {
      render(<AdminSidebar />);
      
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const sidebar = document.getElementById('admin-sidebar');
        expect(sidebar).toHaveClass('translate-x-0');
        expect(sidebar).toHaveAttribute('aria-hidden', 'false');
      });
    });

    test('backdrop overlay should appear when mobile menu is open', async () => {
      render(<AdminSidebar />);
      
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const backdrop = document.querySelector('.fixed.inset-0.z-40.bg-black\\/60');
        expect(backdrop).toBeInTheDocument();
      });
    });

    test('clicking backdrop should close mobile menu', async () => {
      render(<AdminSidebar />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const backdrop = document.querySelector('.fixed.inset-0.z-40.bg-black\\/60');
        expect(backdrop).toBeInTheDocument();
      });
      
      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.z-40.bg-black\\/60');
      fireEvent.click(backdrop!);
      
      await waitFor(() => {
        const sidebar = document.getElementById('admin-sidebar');
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });
  });

  describe('Touch-Friendly Navigation', () => {
    test('navigation items should have proper touch target sizes', async () => {
      render(<AdminSidebar />);
      
      // Open menu to make navigation accessible
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const navigationLinks = document.querySelectorAll('[role="listitem"]');
        navigationLinks.forEach(link => {
          const linkElement = link.querySelector('div');
          expect(linkElement).toHaveClass('min-h-[52px]', 'sm:min-h-[56px]', 'lg:min-h-[48px]');
        });
      });
    });

    test('hamburger button should have minimum 48px touch target', () => {
      render(<AdminSidebar />);
      
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      expect(hamburgerButton).toHaveClass('min-w-[48px]', 'min-h-[48px]');
    });

    test('close button should have proper touch target size', async () => {
      render(<AdminSidebar />);
      
      // Open menu first
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const closeButtons = screen.getAllByLabelText(/menüyü kapat/i);
        // Get the close button inside the sidebar (not the hamburger button)
        const sidebarCloseButton = closeButtons.find(button => 
          button.closest('#admin-sidebar')
        );
        expect(sidebarCloseButton).toHaveClass('min-w-[48px]', 'min-h-[48px]');
      });
    });
  });

  describe('Responsive Layout', () => {
    test('sidebar should have proper responsive width classes', () => {
      render(<AdminSidebar />);
      
      const sidebar = document.getElementById('admin-sidebar');
      expect(sidebar).toHaveClass(
        'w-80', 'sm:w-84', 'md:w-80', 'lg:w-64', 'xl:w-72', '2xl:w-80'
      );
    });

    test('sidebar should have proper max-width constraints', () => {
      render(<AdminSidebar />);
      
      const sidebar = document.getElementById('admin-sidebar');
      expect(sidebar).toHaveClass(
        'max-w-[90vw]', 'sm:max-w-[85vw]', 'md:max-w-[320px]', 'lg:max-w-none'
      );
    });

    test('navigation items should have responsive spacing', async () => {
      render(<AdminSidebar />);
      
      // Open menu to make navigation accessible
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const navigation = document.querySelector('[role="list"]');
        expect(navigation).toHaveClass('space-y-1', 'sm:space-y-2');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('pressing Escape should close mobile menu', async () => {
      render(<AdminSidebar />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const sidebar = document.getElementById('admin-sidebar');
        expect(sidebar).toHaveClass('translate-x-0');
      });
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        const sidebar = document.getElementById('admin-sidebar');
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });

    test('Tab navigation should work properly within sidebar', async () => {
      render(<AdminSidebar />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const sidebar = document.getElementById('admin-sidebar');
        expect(sidebar).toHaveClass('translate-x-0');
      });
      
      // Test Tab key handling
      const sidebar = document.getElementById('admin-sidebar');
      fireEvent.keyDown(sidebar!, { key: 'Tab' });
      
      // Should not throw any errors
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Body Scroll Prevention', () => {
    test('body overflow should be hidden when mobile menu is open', async () => {
      render(<AdminSidebar />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.documentElement.style.overflow).toBe('hidden');
      });
    });

    test('body overflow should be restored when mobile menu is closed', async () => {
      render(<AdminSidebar />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
      
      // Close menu by clicking backdrop (which calls handleMobileLinkClick)
      const backdrop = document.querySelector('.fixed.inset-0.z-40.bg-black\\/60');
      fireEvent.click(backdrop!);
      
      // Wait for animation and cleanup to complete
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
        expect(document.documentElement.style.overflow).toBe('');
      }, { timeout: 1500 });
    });
  });

  describe('Animation States', () => {
    test('buttons should be disabled during animation', async () => {
      render(<AdminSidebar />);
      
      const hamburgerButton = screen.getByLabelText(/menüyü aç/i);
      fireEvent.click(hamburgerButton);
      
      // Button should be temporarily disabled during animation
      expect(hamburgerButton).toHaveAttribute('disabled');
      
      // Wait for animation to complete
      await waitFor(() => {
        expect(hamburgerButton).not.toHaveAttribute('disabled');
      }, { timeout: 500 });
    });
  });

  describe('Active Link Highlighting', () => {
    test('current page should be highlighted in navigation', () => {
      mockUsePathname.mockReturnValue('/admin/projects');
      render(<AdminSidebar />);
      
      const projectLink = screen.getByText('Proje Yönetimi').closest('div');
      expect(projectLink).toHaveClass('bg-brand-primary', 'text-white');
    });

    test('dashboard link should use exact match', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');
      render(<AdminSidebar />);
      
      const dashboardLink = screen.getByText('Gösterge Paneli').closest('div');
      expect(dashboardLink).toHaveClass('bg-brand-primary', 'text-white');
    });
  });
});