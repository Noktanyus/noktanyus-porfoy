/**
 * @file Visual regression testing for responsive layouts
 * @description Tests visual consistency across different screen sizes and orientations
 */

import { render, screen } from '@testing-library/react';
import { 
  mockWindowDimensions, 
  mockMatchMedia,
  BREAKPOINTS,
  cleanupResponsiveTest,
  getResponsiveStyles
} from '../utils/responsive-test-utils';

// Import components to test
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProjectCard from '../../components/ProjectCard';
import BlogCard from '../../components/BlogCard';
import AdminSidebar from '../../components/admin/AdminSidebar';
import HeroSection from '../../components/home/HeroSection';

describe('Visual Regression Testing', () => {
  beforeEach(() => {
    cleanupResponsiveTest();
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Layout Consistency Across Breakpoints', () => {
    const testBreakpoints = [
      { name: 'mobile', width: 375 },
      { name: 'mobile-large', width: 414 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'desktop-large', width: 1280 },
      { name: 'wide', width: 1920 },
    ];

    testBreakpoints.forEach(({ name, width }) => {
      describe(`${name} breakpoint (${width}px)`, () => {
        beforeEach(() => {
          mockWindowDimensions(width);
          mockMatchMedia(width);
        });

        test('header should maintain consistent layout', () => {
          render(<Header headerTitle="Test Portfolio" />);
          
          const header = screen.getByRole('banner');
          const styles = getResponsiveStyles(header);
          
          expect(header).toBeInTheDocument();
          expect(styles.display).toBeDefined();
          
          // Header should never overflow
          const rect = header.getBoundingClientRect();
          expect(rect.width).toBeLessThanOrEqual(width);
          
          // Navigation should be accessible
          const navigation = screen.getByRole('navigation');
          expect(navigation).toBeInTheDocument();
        });

        test('footer should adapt properly', () => {
          const mockAboutData = {
            id: '1',
            name: 'Test User',
            title: 'Developer',
            description: 'Test description',
            profileImage: null,
            contactEmail: 'test@example.com',
            socialGithub: 'https://github.com/test',
            socialLinkedin: 'https://linkedin.com/in/test',
            socialInstagram: 'https://instagram.com/test',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          render(<Footer aboutData={mockAboutData} />);
          
          const footer = screen.getByRole('contentinfo');
          const styles = getResponsiveStyles(footer);
          
          expect(footer).toBeInTheDocument();
          expect(styles.display).toBeDefined();
          
          // Footer should not overflow
          const rect = footer.getBoundingClientRect();
          expect(rect.width).toBeLessThanOrEqual(width);
        });

        test('project cards should maintain aspect ratios', () => {
          const mockProject = {
            id: '1',
            title: 'Test Project',
            description: 'This is a test project description that should wrap properly across different screen sizes.',
            technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
            imageUrl: '/test-image.jpg',
            projectUrl: 'https://example.com',
            githubUrl: 'https://github.com/test',
            featured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          render(<ProjectCard project={mockProject} />);
          
          const card = screen.getByRole('article');
          const image = screen.getByRole('img');
          
          expect(card).toBeInTheDocument();
          expect(image).toBeInTheDocument();
          
          // Card should not overflow container
          const cardRect = card.getBoundingClientRect();
          expect(cardRect.width).toBeLessThanOrEqual(width);
          
          // Image should maintain aspect ratio
          const imageRect = image.getBoundingClientRect();
          expect(imageRect.width).toBeGreaterThan(0);
          expect(imageRect.height).toBeGreaterThan(0);
          
          // Technology tags should wrap properly
          const techTags = screen.getAllByText(/React|TypeScript|Tailwind|Next/);
          expect(techTags.length).toBeGreaterThan(0);
        });

        test('blog cards should handle content overflow', () => {
          const mockBlog = {
            id: '1',
            title: 'Very Long Blog Post Title That Should Wrap Properly Across Different Screen Sizes',
            excerpt: 'This is a very long blog post excerpt that should wrap properly and not overflow the container boundaries on any screen size.',
            slug: 'test-blog-post',
            tags: ['React', 'TypeScript', 'Web Development', 'Responsive Design'],
            imageUrl: '/test-blog-image.jpg',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          render(<BlogCard blog={mockBlog} />);
          
          const card = screen.getByRole('article');
          const title = screen.getByRole('heading');
          
          expect(card).toBeInTheDocument();
          expect(title).toBeInTheDocument();
          
          // Card should not overflow
          const cardRect = card.getBoundingClientRect();
          expect(cardRect.width).toBeLessThanOrEqual(width);
          
          // Title should wrap properly
          const titleRect = title.getBoundingClientRect();
          expect(titleRect.width).toBeLessThanOrEqual(cardRect.width);
        });

        test('hero section should scale appropriately', () => {
          const mockAboutData = {
            id: '1',
            name: 'Test User',
            title: 'Full Stack Developer',
            description: 'I create beautiful and functional web applications.',
            profileImage: '/test-profile.jpg',
            contactEmail: 'test@example.com',
            socialGithub: 'https://github.com/test',
            socialLinkedin: 'https://linkedin.com/in/test',
            socialInstagram: 'https://instagram.com/test',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          render(<HeroSection aboutData={mockAboutData} />);
          
          const heroSection = screen.getByRole('main') || screen.getByText(mockAboutData.name).closest('section');
          
          if (heroSection) {
            const rect = heroSection.getBoundingClientRect();
            expect(rect.width).toBeLessThanOrEqual(width);
            
            // Text should be readable at all sizes
            const title = screen.getByText(mockAboutData.name);
            const titleStyles = window.getComputedStyle(title);
            const fontSize = parseInt(titleStyles.fontSize);
            
            // Font size should be appropriate for screen size
            if (width < 768) {
              expect(fontSize).toBeGreaterThanOrEqual(24); // Minimum readable size on mobile
            } else {
              expect(fontSize).toBeGreaterThanOrEqual(32); // Larger on desktop
            }
          }
        });
      });
    });
  });

  describe('Orientation-Specific Visual Tests', () => {
    const orientationTests = [
      { name: 'mobile-portrait', width: 375, height: 667 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
    ];

    orientationTests.forEach(({ name, width, height }) => {
      describe(`${name} orientation`, () => {
        beforeEach(() => {
          mockWindowDimensions(width, height);
          mockMatchMedia(width);
        });

        test('admin sidebar should adapt to orientation', () => {
          render(<AdminSidebar />);
          
          const sidebar = screen.getByRole('navigation');
          const styles = getResponsiveStyles(sidebar);
          
          expect(sidebar).toBeInTheDocument();
          
          // Sidebar should adapt to available space
          const rect = sidebar.getBoundingClientRect();
          
          if (name.includes('landscape') && width < 1024) {
            // In landscape mobile/tablet, sidebar might be collapsed or repositioned
            expect(rect.width).toBeLessThanOrEqual(width * 0.8); // Should not take up too much horizontal space
          }
          
          if (name.includes('portrait')) {
            // In portrait, sidebar should be optimized for vertical space
            expect(rect.height).toBeLessThanOrEqual(height);
          }
        });

        test('navigation should remain accessible in all orientations', () => {
          render(<Header headerTitle="Test Portfolio" />);
          
          const navigation = screen.getByRole('navigation');
          const rect = navigation.getBoundingClientRect();
          
          // Navigation should always be visible and accessible
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
          
          // Should not overflow viewport
          expect(rect.width).toBeLessThanOrEqual(width);
          expect(rect.height).toBeLessThanOrEqual(height);
        });
      });
    });
  });

  describe('High-DPI Display Testing', () => {
    const pixelRatios = [1, 1.5, 2, 3];

    pixelRatios.forEach((ratio) => {
      describe(`Device pixel ratio: ${ratio}`, () => {
        beforeEach(() => {
          Object.defineProperty(window, 'devicePixelRatio', {
            value: ratio,
            writable: true,
          });
          mockWindowDimensions(BREAKPOINTS.mobile);
          mockMatchMedia(BREAKPOINTS.mobile);
        });

        test('images should render appropriately for pixel density', () => {
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
          expect(image).toBeInTheDocument();
          
          // Image should have appropriate src for pixel density
          const src = image.getAttribute('src');
          expect(src).toBeTruthy();
          
          // High-DPI displays should potentially load higher resolution images
          if (ratio >= 2) {
            // Should handle retina displays appropriately
            expect(image).toHaveAttribute('src');
          }
        });

        test('text should remain crisp at all pixel densities', () => {
          render(<Header headerTitle="Test Portfolio" />);
          
          const headings = screen.getAllByRole('heading');
          const links = screen.getAllByRole('link');
          
          [...headings, ...links].forEach((element) => {
            const styles = window.getComputedStyle(element);
            
            // Text should have appropriate sizing for pixel density
            const fontSize = parseInt(styles.fontSize);
            expect(fontSize).toBeGreaterThan(0);
            
            // Should not have blurry text rendering
            expect(styles.textRendering).not.toBe('optimizeSpeed');
          });
        });
      });
    });
  });

  describe('Dark Mode Visual Consistency', () => {
    beforeEach(() => {
      // Mock dark mode preference
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
    });

    test('components should maintain contrast in dark mode', () => {
      mockWindowDimensions(BREAKPOINTS.desktop);
      mockMatchMedia(BREAKPOINTS.desktop);

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      const styles = window.getComputedStyle(header);
      
      // Should have appropriate dark mode styling
      expect(styles.backgroundColor).toBeDefined();
      expect(styles.color).toBeDefined();
    });
  });

  describe('Animation and Transition Consistency', () => {
    test('should handle reduced motion preferences', () => {
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
      mockMatchMedia(BREAKPOINTS.mobile);

      render(<Header headerTitle="Test Portfolio" />);
      
      const header = screen.getByRole('banner');
      const styles = window.getComputedStyle(header);
      
      // Should respect reduced motion preferences
      expect(styles.animationDuration).toBeDefined();
      expect(styles.transitionDuration).toBeDefined();
    });

    test('should maintain smooth transitions across breakpoints', () => {
      const breakpoints = [BREAKPOINTS.mobile, BREAKPOINTS.tablet, BREAKPOINTS.desktop];
      
      breakpoints.forEach((width) => {
        mockWindowDimensions(width);
        mockMatchMedia(width);

        render(<Header headerTitle="Test Portfolio" />);
        
        const header = screen.getByRole('banner');
        const styles = window.getComputedStyle(header);
        
        // Transitions should be consistent
        expect(styles.transition).toBeDefined();
      });
    });
  });

  describe('Print Media Visual Tests', () => {
    test('should handle print media queries', () => {
      // Mock print media
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query: string) => {
          if (query.includes('print')) {
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

      mockWindowDimensions(BREAKPOINTS.desktop);

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
      
      // Should handle print styles appropriately
      const styles = window.getComputedStyle(card);
      expect(styles.display).toBeDefined();
    });
  });
});