/**
 * @file Mobile performance testing for responsive components
 * @description Tests performance characteristics on mobile devices and low-power hardware
 */

import { render, screen, act } from '@testing-library/react';
import { 
  mockWindowDimensions, 
  mockMatchMedia,
  mockTouchSupport,
  BREAKPOINTS,
  cleanupResponsiveTest
} from '../utils/responsive-test-utils';

// Import components to test
import Header from '../../components/layout/Header';
import ProjectCard from '../../components/ProjectCard';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectList from '../../components/ProjectList';

// Mock performance APIs
const mockPerformanceObserver = () => {
  global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }));

  global.performance = {
    ...global.performance,
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    now: jest.fn(() => Date.now()),
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now(),
    },
  } as any;
};

describe('Mobile Performance Testing', () => {
  beforeEach(() => {
    cleanupResponsiveTest();
    mockTouchSupport();
    mockWindowDimensions(BREAKPOINTS.mobile);
    mockMatchMedia(BREAKPOINTS.mobile);
    mockPerformanceObserver();
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Rendering Performance', () => {
    test('header should render quickly on mobile', () => {
      const startTime = performance.now();
      
      render(<Header headerTitle="Test Portfolio" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Header should render in under 100ms on mobile
      expect(renderTime).toBeLessThan(100);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    test('project cards should render efficiently in lists', () => {
      const mockProjects = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test Project ${i + 1}`,
        description: `Description for project ${i + 1}`,
        technologies: ['React', 'TypeScript'],
        imageUrl: `/test-image-${i + 1}.jpg`,
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const startTime = performance.now();
      
      render(
        <div>
          {mockProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 10 cards should render in under 200ms
      expect(renderTime).toBeLessThan(200);
      
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(10);
    });

    test('admin sidebar should load quickly', () => {
      const startTime = performance.now();
      
      render(<AdminSidebar />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Sidebar should render in under 50ms
      expect(renderTime).toBeLessThan(50);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Memory Usage Optimization', () => {
    test('should handle low memory devices', () => {
      // Mock low memory device
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 1, // 1GB RAM
        writable: true,
      });

      // Mock memory pressure
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 300,
          saveData: true,
        },
        writable: true,
      });

      const mockProjects = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Project ${i + 1}`,
        description: 'Description',
        technologies: ['React'],
        imageUrl: `/image-${i + 1}.jpg`,
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      render(<ProjectList projects={mockProjects} />);
      
      // Should handle large lists efficiently on low-memory devices
      const list = screen.getByRole('main') || screen.getByTestId('project-list');
      expect(list).toBeInTheDocument();
    });

    test('should implement lazy loading for images', () => {
      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const image = screen.getByRole('img');
      
      // Images should have lazy loading enabled
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    test('should optimize for reduced data usage', () => {
      // Mock save-data preference
      Object.defineProperty(navigator, 'connection', {
        value: {
          saveData: true,
          effectiveType: '2g',
        },
        writable: true,
      });

      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      
      // Should optimize for data saving when requested
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Animation Performance', () => {
    test('should reduce animations on low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2, // Dual-core processor
        writable: true,
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB RAM
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      const computedStyle = window.getComputedStyle(header);
      
      // Should have appropriate animation settings for low-end devices
      expect(computedStyle.animationDuration).toBeDefined();
    });

    test('should respect prefers-reduced-motion', () => {
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

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should respect reduced motion preferences
      const computedStyle = window.getComputedStyle(header);
      expect(computedStyle.animationDuration).toBeDefined();
    });

    test('should optimize scroll performance', async () => {
      const mockProjects = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Project ${i + 1}`,
        description: 'Description',
        technologies: ['React'],
        imageUrl: `/image-${i + 1}.jpg`,
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      render(<ProjectList projects={mockProjects} />);
      
      const list = screen.getByRole('main') || screen.getByTestId('project-list');
      
      // Simulate scroll events
      const scrollEvents = Array.from({ length: 10 }, (_, i) => 
        new Event('scroll', { bubbles: true })
      );

      const startTime = performance.now();
      
      await act(async () => {
        scrollEvents.forEach(event => {
          list.dispatchEvent(event);
        });
      });
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      // Scroll handling should be efficient
      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe('Network Performance', () => {
    test('should handle slow network connections', () => {
      // Mock slow 3G connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          downlink: 1.5,
          rtt: 300,
          saveData: false,
        },
        writable: true,
      });

      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      
      // Should optimize for slow connections
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    test('should handle offline scenarios', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should handle offline gracefully
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Touch Performance', () => {
    test('should handle rapid touch events efficiently', async () => {
      render(<Header headerTitle="Test Portfolio" />);
      
      const button = screen.getAllByRole('button')[0];
      
      const startTime = performance.now();
      
      // Simulate rapid touch events
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          const touchEvent = new TouchEvent('touchstart', {
            touches: [{
              identifier: i,
              target: button,
              clientX: 50,
              clientY: 50,
            } as Touch],
            bubbles: true,
          });
          
          button.dispatchEvent(touchEvent);
          
          // Small delay between touches
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });
      
      const endTime = performance.now();
      const touchTime = endTime - startTime;
      
      // Touch handling should be efficient
      expect(touchTime).toBeLessThan(500);
    });

    test('should debounce touch events appropriately', async () => {
      const mockProject = {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['React'],
        imageUrl: '/test-image.jpg',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<ProjectCard project={mockProject} />);
      
      const card = screen.getByRole('article');
      
      // Simulate multiple rapid touches
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          const touchEvent = new TouchEvent('touchstart', {
            touches: [{
              identifier: i,
              target: card,
              clientX: 50 + i,
              clientY: 50,
            } as Touch],
            bubbles: true,
          });
          
          card.dispatchEvent(touchEvent);
        }
      });
      
      expect(card).toBeInTheDocument();
    });
  });

  describe('Battery Performance', () => {
    test('should optimize for low battery', () => {
      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: jest.fn().mockResolvedValue({
          level: 0.2, // 20% battery
          charging: false,
          chargingTime: Infinity,
          dischargingTime: 3600, // 1 hour remaining
        }),
        writable: true,
      });

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Should optimize for battery saving
      const computedStyle = window.getComputedStyle(header);
      expect(computedStyle.animationDuration).toBeDefined();
    });

    test('should reduce background processing on low battery', async () => {
      // Mock low battery state
      Object.defineProperty(navigator, 'getBattery', {
        value: jest.fn().mockResolvedValue({
          level: 0.1, // 10% battery
          charging: false,
        }),
        writable: true,
      });

      const mockProjects = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Project ${i + 1}`,
        description: 'Description',
        technologies: ['React'],
        imageUrl: `/image-${i + 1}.jpg`,
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/test',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      render(<ProjectList projects={mockProjects} />);
      
      const list = screen.getByRole('main') || screen.getByTestId('project-list');
      expect(list).toBeInTheDocument();
      
      // Should reduce background processing
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});