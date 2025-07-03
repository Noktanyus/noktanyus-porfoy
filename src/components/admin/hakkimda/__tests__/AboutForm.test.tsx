// src/components/admin/hakkimda/__tests__/AboutForm.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutForm from '../AboutForm';
import { AboutData } from '@/types/content';

describe('AboutForm', () => {
  const mockAboutData: Partial<AboutData> = {
    name: 'Test User',
    title: 'Test Title',
    social: {
      github: 'github.com/test',
      linkedin: 'linkedin.com/test',
      twitter: 'twitter.com/test',
    }
  };

  const mockOnAboutChange = jest.fn();
  const mockOnSocialChange = jest.fn();
  const mockOnFileChange = jest.fn();

  beforeEach(() => {
    render(
      <AboutForm 
        aboutData={mockAboutData}
        onAboutChange={mockOnAboutChange}
        onSocialChange={mockOnSocialChange}
        onFileChange={mockOnFileChange}
      />
    );
  });

  it('should render form fields with initial data', () => {
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('github.com/test')).toBeInTheDocument();
  });

  it('should call onAboutChange when a general field is changed', () => {
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(mockOnAboutChange).toHaveBeenCalledWith('name', 'New Name');
  });

  it('should call onSocialChange when a social media field is changed', () => {
    const githubInput = screen.getByDisplayValue('github.com/test');
    fireEvent.change(githubInput, { target: { value: 'github.com/new' } });

    expect(mockOnSocialChange).toHaveBeenCalledWith('github', 'github.com/new');
  });
});
