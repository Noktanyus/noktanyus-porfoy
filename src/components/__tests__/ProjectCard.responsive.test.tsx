/**
 * @file Responsive tests for ProjectCard component
 * @description Tests ProjectCard component behavior across different breakpoints and layouts
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '@/types/content';
import {
  renderWithViewport,
  testAcrossBreakpoints,
  hasMinimumTouchTarget,
  getResponsiveStyles,
  cleanupResponsiveTest,
} from '../../__tests__/utils/responsive-test-utils';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, sizes, style, className, priority, ...props }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          ...(fill && { position: 'absolute', inset: 0, width: '100%', height: '100%' })
        }}
        data-fill={fill}
        data-sizes={sizes}
        data-priority={priority}
        {...props}
      />
    );
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('ProjectCard Responsive Tests', () => {
  const mockProject: Project = {
    id: 'test-project',
    slug: 'test-project',
    title: 'Responsive Test Project',
    description: 'This is a test project description that should wrap properly on different screen sizes and maintain readability across all breakpoints.',
    mainImage: '/images/test-project.webp',
    technologies: 'React,Next.js,TypeScript,Tailwind CSS,Jest',
    date: new Date('2024-01-15'),
    order: 1,
    liveDemo: 'https://example.com/demo',
    githubRepo: 'https://github.com/user/test-project',
    featured: true,
    isLive: true,
    content: 'Test project content',
  };

  const mockProjectLongTitle: Project = {
    ...mockProject,
    title: 'This is a Very Long Project Title That Should Be Truncated Properly on Mobile Devices',
  };

  const mockProjectManyTechnologies: Project = {
    ...mockProject,
    technologies: 'React,Next.js,TypeScript,Tailwind CSS,Jest,Node.js,Express,MongoDB,Redis,Docker,Kubernetes,AWS',
  };

  beforeEach(() => {
    cleanupResponsiveTest();
  });

  afterEach(() => {
    cleanupResponsiveTest();
  });

  describe('Layout Behavior Across Breakpoints', () => {
    testAcrossBreakpoints(
      <ProjectCard project={mockProject} />,
      (breakpoint) => {
        it(`should have proper layout structure at ${breakpoint}`, () => {
          const article = screen.getByRole('article');
          
          if (breakpoint === 'mobile' || breakpoint === 'tablet') {
            // Mobile and tablet should use flex-col (vertical stack)
            expect(article).toHaveClass('flex-col');
          } else {
            // Desktop should use flex-row (horizontal layout)
            expect(article).toHaveClass('lg:flex-row');
          }
        });

        it(`should have appropriate image dimensions at ${breakpoint}`, () => {
          const imageContainer = screen.getByRole('img').closest('div');
          
          if (breakpoint === 'mobile' || breakpoint === 'tablet') {
            // Mobile should have fixed height
            expect(imageContainer).toHaveClass('h-48', 'sm:h-56', 'md:h-64');
          } else {
            // Desktop should have flexible height
            expect(imageContainer).toHaveClass('lg:h-auto', 'lg:min-h-[280px]');
          }
        });

        it(`should have proper content padding at ${breakpoint}`, () => {
          const contentSection = screen.getByText(mockProject.title).closest('div');
          
          expect(contentSection).toHaveClass('p-4', 'sm:p-6', 'lg:p-8');
        });
      }
    );
  });

  describe('Image Responsive Behavior', () => {
    testAcrossBreakpoints(
      <ProjectCard project={mockProject} />,
      (breakpoint) => {
        it(`should have proper image sizing at ${breakpoint}`, () => {
          const image = screen.getByRole('img');
          
          expect(image).toHaveAttribute('data-fill', 'true');
          expect(image).toHaveStyle({ objectFit: 'cover' });
          
          // Check responsive sizes attribute
          const sizes = image.getAttribute('data-sizes');
          expect(sizes).toContain('(max-width: 640px) 100vw');
          expect(sizes).toContain('(max-width: 1024px) 100vw');
          expect(sizes).toContain('40vw');
        });

        it(`should have proper aspect ratio container at ${breakpoint}`, () => {
          const imageContainer = screen.getByRole('img').closest('div');
          expect(imageContainer).toHaveClass('relative');
          
          if (breakpoint === 'mobile') {
            expect(imageContainer).toHaveClass('h-48');
          } else if (breakpoint === 'tablet') {
            expect(imageContainer).toHaveClass('sm:h-56', 'md:h-64');
          } else {
            expect(imageContainer).toHaveClass('lg:h-auto', 'lg:min-h-[280px]');
          }
        });
      }
    );
  });

  describe('Typography and Text Handling', () => {
    it('should truncate long titles properly on mobile', () => {
      renderWithViewport(<ProjectCard project={mockProjectLongTitle} />, 'mobile');
      
      const title = screen.getByText(mockProjectLongTitle.title);
      expect(title).toHaveClass('line-clamp-2');
    });

    it('should handle description text wrapping', () => {
      testAcrossBreakpoints(
        <ProjectCard project={mockProject} />,
        (breakpoint) => {
          const description = screen.getByText(mockProject.description);
          
          expect(description).toHaveClass('leading-relaxed');
          
          if (breakpoint === 'mobile') {
            expect(description).toHaveClass('line-clamp-3');
          } else {
            expect(description).toHaveClass('sm:line-clamp-4');
          }
        }
      );
    });

    it('should have responsive font sizes', () => {
      testAcrossBreakpoints(
        <ProjectCard project={mockProject} />,
        (breakpoint) => {
          const title = screen.getByText(mockProject.title);
          const description = screen.getByText(mockProject.description);
          
          // Title should have responsive sizing
          expect(title).toHaveClass('text-xl', 'sm:text-2xl', 'lg:text-3xl');
          
          // Description should have responsive sizing
          expect(description).toHaveClass('text-sm', 'sm:text-base');
        }
      );
    });
  });

  describe('Technology Tags Responsive Behavior', () => {
    it('should limit technology tags display', () => {
      renderWithViewport(<ProjectCard project={mockProjectManyTechnologies} />, 'mobile');
      
      // Should show max 5 technologies
      const techTags = screen.getAllByText(/React|Next\.js|TypeScript|Tailwind CSS|Jest/);
      expect(techTags).toHaveLength(5);
      
      // Should show "+X" indicator for remaining technologies
      const remainingIndicator = screen.getByText('+7');
      expect(remainingIndicator).toBeInTheDocument();
    });

    it('should have proper tag spacing and wrapping', () => {
      testAcrossBreakpoints(
        <ProjectCard project={mockProject} />,
        (breakpoint) => {
          const tagContainer = screen.getByText('React').closest('div');
          
          expect(tagContainer).toHaveClass('flex', 'flex-wrap');
          expect(tagContainer).toHaveClass('gap-1.5', 'sm:gap-2');
        }
      );
    });

    it('should have responsive tag sizing', () => {
      testAcrossBreakpoints(
        <ProjectCard project={mockProject} />,
        (breakpoint) => {
          const reactTag = screen.getByText('React');
          
          expect(reactTag).toHaveClass('px-2', 'sm:px-3');
          expect(reactTag).toHaveClass('py-1', 'sm:py-1.5');
          expect(reactTag).toHaveClass('text-xs', 'sm:text-sm');
        }
      );
    });
  });

  describe('Action Buttons Responsive Behavior', () => {
    testAcrossBreakpoints(
      <ProjectCard project={mockProject} />,
      (breakpoint) => {
        it(`should have proper button layout at ${breakpoint}`, () => {
          const buttonContainer = screen.getByText('Daha Fazlasını Gör').closest('div');
          
          if (breakpoint === 'mobile') {
            expect(buttonContainer).toHaveClass('flex-col');
          } else {
            expect(buttonContainer).toHaveClass('sm:flex-row', 'sm:items-center');
          }
        });

        it(`should have minimum touch target sizes at ${breakpoint}`, () => {
          const mainButton = screen.getByText('Daha Fazlasını Gör');
          expect(hasMinimumTouchTarget(mainButton)).toBe(true);
          
          if (mockProject.liveDemo) {
            const demoButton = screen.getByTitle('Canlı Demo');
            expect(hasMinimumTouchTarget(demoButton)).toBe(true);
          }
          
          if (mockProject.githubRepo) {
            const githubButton = screen.getByTitle('Kaynak Kodu');
            expect(hasMinimumTouchTarget(githubButton)).toBe(true);
          }
        });

        it(`should have proper button spacing at ${breakpoint}`, () => {
          const buttonContainer = screen.getByText('Daha Fazlasını Gör').closest('div');
          
          expect(buttonContainer).toHaveClass('gap-3', 'sm:gap-4');
        });
      }
    );

    it('should have touch-friendly external link buttons', () => {
      renderWithViewport(<ProjectCard project={mockProject} />, 'mobile');
      
      const demoButton = screen.getByTitle('Canlı Demo');
      const githubButton = screen.getByTitle('Kaynak Kodu');
      
      expect(demoButton).toHaveClass('min-w-[44px]', 'min-h-[44px]', 'w-11', 'h-11');
      expect(githubButton).toHaveClass('min-w-[44px]', 'min-h-[44px]', 'w-11', 'h-11');
      
      expect(demoButton).toHaveClass('active:scale-95');
      expect(githubButton).toHaveClass('active:scale-95');
    });
  });

  describe('Hover and Interaction States', () => {
    it('should have proper hover effects on desktop', () => {
      renderWithViewport(<ProjectCard project={mockProject} />, 'desktop');
      
      const article = screen.getByRole('article');
      expect(article).toHaveClass('hover:shadow-2xl', 'hover:-translate-y-1');
      
      const image = screen.getByRole('img');
      expect(image).toHaveClass('group-hover:scale-105');
    });

    it('should have touch-friendly active states on mobile', () => {
      renderWithViewport(<ProjectCard project={mockProject} />, 'mobile');
      
      const demoButton = screen.getByTitle('Canlı Demo');
      const githubButton = screen.getByTitle('Kaynak Kodu');
      
      expect(demoButton).toHaveClass('active:scale-95');
      expect(githubButton).toHaveClass('active:scale-95');
    });
  });

  describe('Accessibility', () => {
    testAcrossBreakpoints(
      <ProjectCard project={mockProject} />,
      (breakpoint) => {
        it(`should have proper semantic structure at ${breakpoint}`, () => {
          const article = screen.getByRole('article');
          expect(article).toBeInTheDocument();
          
          const title = screen.getByRole('heading', { level: 3 });
          expect(title).toHaveTextContent(mockProject.title);
          
          const image = screen.getByRole('img');
          expect(image).toHaveAttribute('alt', `${mockProject.title} projesinin görseli`);
        });

        it(`should have accessible links at ${breakpoint}`, () => {
          const mainLink = screen.getByRole('link', { name: /Daha Fazlasını Gör/ });
          expect(mainLink).toHaveAttribute('href', `/projelerim/${mockProject.slug}`);
          
          if (mockProject.liveDemo) {
            const demoLink = screen.getByTitle('Canlı Demo');
            expect(demoLink).toHaveAttribute('href', mockProject.liveDemo);
            expect(demoLink).toHaveAttribute('target', '_blank');
            expect(demoLink).toHaveAttribute('rel', 'noopener noreferrer');
          }
          
          if (mockProject.githubRepo) {
            const githubLink = screen.getByTitle('Kaynak Kodu');
            expect(githubLink).toHaveAttribute('href', mockProject.githubRepo);
            expect(githubLink).toHaveAttribute('target', '_blank');
            expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
          }
        });
      }
    );

    it('should support keyboard navigation', async () => {
      renderWithViewport(<ProjectCard project={mockProject} />, 'desktop');
      
      const mainLink = screen.getByRole('link', { name: /Daha Fazlasını Gör/ });
      const demoLink = screen.getByTitle('Canlı Demo');
      const githubLink = screen.getByTitle('Kaynak Kodu');
      
      // Focus elements
      mainLink.focus();
      expect(mainLink).toHaveFocus();
      
      demoLink.focus();
      expect(demoLink).toHaveFocus();
      
      githubLink.focus();
      expect(githubLink).toHaveFocus();
    });
  });

  describe('Content Overflow Handling', () => {
    it('should handle long content gracefully', () => {
      const longContentProject: Project = {
        ...mockProject,
        title: 'This is an extremely long project title that should be handled gracefully across all breakpoints without breaking the layout',
        description: 'This is an extremely long project description that contains a lot of text and should be truncated properly on different screen sizes to maintain a consistent card height and prevent layout issues. It should wrap nicely and show appropriate line clamping.',
      };
      
      testAcrossBreakpoints(
        <ProjectCard project={longContentProject} />,
        (breakpoint) => {
          const title = screen.getByText(longContentProject.title);
          const description = screen.getByText(longContentProject.description);
          
          expect(title).toHaveClass('line-clamp-2');
          
          if (breakpoint === 'mobile') {
            expect(description).toHaveClass('line-clamp-3');
          } else {
            expect(description).toHaveClass('sm:line-clamp-4');
          }
        }
      );
    });

    it('should maintain card structure with missing optional content', () => {
      const minimalProject: Project = {
        id: 'minimal-project',
        slug: 'minimal-project',
        title: 'Minimal Project',
        description: 'Basic description',
        mainImage: '',
        technologies: '',
        date: new Date('2024-01-01'),
        order: 1,
        liveDemo: null,
        githubRepo: null,
        featured: false,
        isLive: false,
        content: '',
      };
      
      renderWithViewport(<ProjectCard project={minimalProject} />, 'mobile');
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      // Should still show main action button
      const mainButton = screen.getByText('Daha Fazlasını Gör');
      expect(mainButton).toBeInTheDocument();
      
      // Should not show external link buttons
      expect(screen.queryByTitle('Canlı Demo')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Kaynak Kodu')).not.toBeInTheDocument();
    });
  });
});