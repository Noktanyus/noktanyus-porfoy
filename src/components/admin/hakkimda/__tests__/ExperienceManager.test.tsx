// src/components/admin/hakkimda/__tests__/ExperienceManager.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExperienceManager from '../ExperienceManager';
import { Experience } from '@/types/content';

describe('ExperienceManager', () => {
  const mockExperiences: Experience[] = [
    { title: 'Software Engineer', company: 'Tech Corp', date: '2022-Present', description: 'Developing cool stuff.' }
  ];

  it('should render initial experiences correctly', () => {
    render(<ExperienceManager experiences={mockExperiences} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
  });

  it('should call onChange when a field is changed', () => {
    const mockOnChange = jest.fn();
    render(<ExperienceManager experiences={mockExperiences} onChange={mockOnChange} />);

    const titleInput = screen.getByDisplayValue('Software Engineer');
    fireEvent.change(titleInput, { target: { value: 'Senior Engineer' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith([
      { ...mockExperiences[0], title: 'Senior Engineer' }
    ]);
  });

  it('should add a new empty experience when "Yeni Tecrübe Ekle" is clicked', () => {
    const mockOnChange = jest.fn();
    render(<ExperienceManager experiences={mockExperiences} onChange={mockOnChange} />);

    const addButton = screen.getByText('Yeni Tecrübe Ekle');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      ...mockExperiences,
      { title: '', company: '', date: '', description: '' }
    ]);
  });

  it('should remove an experience when "Bu Tecrübeyi Sil" is clicked', () => {
    const mockOnChange = jest.fn();
    render(<ExperienceManager experiences={mockExperiences} onChange={mockOnChange} />);

    const removeButton = screen.getByText('Bu Tecrübeyi Sil');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});
