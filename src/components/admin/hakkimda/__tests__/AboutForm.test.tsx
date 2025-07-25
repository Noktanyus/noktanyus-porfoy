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
    socialGithub: 'https://github.com/test',
    socialLinkedin: 'https://linkedin.com/in/test',
    socialInstagram: 'https://instagram.com/test',
  };

  const mockOnAboutChange = jest.fn();

  beforeEach(() => {
    // Her testten önce mock fonksiyonlarını sıfırla
    jest.clearAllMocks();
    render(
      <AboutForm 
        aboutData={mockAboutData}
        onAboutChange={mockOnAboutChange}
        onFileChange={jest.fn()}
      />
    );
  });

  it('should render form fields with initial data', () => {
    expect(screen.getByPlaceholderText('İsim Soyisim')).toHaveValue(mockAboutData.name);
    expect(screen.getByPlaceholderText('Unvan')).toHaveValue(mockAboutData.title);
    expect(screen.getByPlaceholderText('GitHub URL')).toHaveValue(mockAboutData.socialGithub);
  });

  it('should call onAboutChange when a general field is changed', () => {
    const nameInput = screen.getByPlaceholderText('İsim Soyisim');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(mockOnAboutChange).toHaveBeenCalledWith('name', 'New Name');
  });

  it('should call onAboutChange when a social media field is changed', () => {
    const githubInput = screen.getByPlaceholderText('GitHub URL');
    fireEvent.change(githubInput, { target: { value: 'https://github.com/new' } });

    expect(mockOnAboutChange).toHaveBeenCalledWith('socialGithub', 'https://github.com/new');
  });
});
