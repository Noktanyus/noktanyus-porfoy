import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectList from '../ProjectList';
import { Project } from '@/types/content';

// Mock ProjectCard component
jest.mock('../ProjectCard', () => {
  return function MockProjectCard({ project }: { project: Project }) {
    return <div data-testid={`project-${project.id}`}>{project.title}</div>;
  };
});

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Test Project 1',
    description: 'A test project with React',
    slug: 'test-project-1',
    content: 'Test content',
    mainImage: null,
    technologies: 'React,TypeScript',
    liveDemo: 'https://example.com',
    githubRepo: 'https://github.com/test/repo',
    featured: false,
    isLive: true,
    date: new Date('2023-01-01'),
    order: 1
  },
  {
    id: '2',
    title: 'Test Project 2',
    description: 'Another test project with Vue',
    slug: 'test-project-2',
    content: 'Test content 2',
    mainImage: null,
    technologies: 'Vue,JavaScript',
    liveDemo: null,
    githubRepo: 'https://github.com/test/repo2',
    featured: true,
    isLive: false,
    date: new Date('2023-02-01'),
    order: 2
  }
];

describe('ProjectList', () => {
  it('renders search input with proper responsive classes', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Proje adı, teknoloji veya anahtar kelime ara...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveClass('w-full', 'px-4', 'py-3', 'sm:py-4', 'lg:py-5');
    expect(searchInput).toHaveClass('text-base', 'sm:text-lg', 'lg:text-xl');
  });

  it('renders filter buttons with touch-friendly sizing', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const allProjectsButton = screen.getByText('Tüm Projeler');
    const liveProjectsButton = screen.getByText('Canlı Projeler');
    
    expect(allProjectsButton).toHaveClass('min-h-[44px]', 'sm:min-h-[48px]', 'lg:min-h-[52px]');
    expect(liveProjectsButton).toHaveClass('min-h-[44px]', 'sm:min-h-[48px]', 'lg:min-h-[52px]');
  });

  it('filters projects correctly', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    // Initially shows all projects
    expect(screen.getByTestId('project-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-2')).toBeInTheDocument();
    
    // Filter to live projects only
    fireEvent.click(screen.getByText('Canlı Projeler'));
    expect(screen.getByTestId('project-1')).toBeInTheDocument();
    expect(screen.queryByTestId('project-2')).not.toBeInTheDocument();
  });

  it('searches projects correctly', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Proje adı, teknoloji veya anahtar kelime ara...');
    
    // Search for React
    fireEvent.change(searchInput, { target: { value: 'React' } });
    expect(screen.getByTestId('project-1')).toBeInTheDocument();
    expect(screen.queryByTestId('project-2')).not.toBeInTheDocument();
  });

  it('shows results count when filtering or searching', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Proje adı, teknoloji veya anahtar kelime ara...');
    
    // Search for React
    fireEvent.change(searchInput, { target: { value: 'React' } });
    expect(screen.getByText(/1 proje bulundu/)).toBeInTheDocument();
  });

  it('shows empty state with reset button when no results found', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const searchInput = screen.getByPlaceholderText('Proje adı, teknoloji veya anahtar kelime ara...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    expect(screen.getByText('Aradığınız kriterlere uygun proje bulunamadı')).toBeInTheDocument();
    expect(screen.getByText('Tüm Projeleri Göster')).toBeInTheDocument();
    
    // Click reset button
    fireEvent.click(screen.getByText('Tüm Projeleri Göster'));
    expect(screen.getByTestId('project-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-2')).toBeInTheDocument();
  });

  it('has proper responsive grid spacing', () => {
    render(<ProjectList allProjects={mockProjects} />);
    
    const projectGrid = screen.getByTestId('project-1').parentElement;
    expect(projectGrid).toHaveClass('grid', 'grid-cols-1');
    expect(projectGrid).toHaveClass('gap-6', 'sm:gap-8', 'md:gap-10', 'lg:gap-12', 'xl:gap-14');
  });
});