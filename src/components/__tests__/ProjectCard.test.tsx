// src/components/__tests__/ProjectCard.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '@/types/content';

// Next.js'in <Image> bileşenini taklit et
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // fill prop'unu string'e çevirerek uyarıyı engelle
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} fill={fill ? fill.toString() : undefined} />;
  },
}));

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: 'test-project',
    title: 'My Awesome Project',
    description: 'This is a description of the project.',
    mainImage: '/images/test.png', // Doğru prop adı: mainImage
    technologies: ['React', 'Next.js'],
    date: '2023-01-01',
    order: 1,
  };

  it('should render project details correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('My Awesome Project')).toBeInTheDocument();
    expect(screen.getByText('This is a description of the project.')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/images/test.png');
  });

  it('should render a link to the project page', () => {
    render(<ProjectCard project={mockProject} />);

    // Proje detayları linkini spesifik olarak test et
    const link = screen.getByRole('link', { name: /proje detayları/i });
    expect(link).toHaveAttribute('href', '/projelerim/test-project');
  });
});