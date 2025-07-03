// src/components/admin/hakkimda/__tests__/SkillManager.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillManager from '../SkillManager';

describe('SkillManager', () => {
  const mockSkills = [{ name: 'React' }, { name: 'TypeScript' }];
  
  it('should render initial skills correctly', () => {
    // Hazırlık ve Eylem
    render(<SkillManager skills={mockSkills} onChange={jest.fn()} />);

    // Doğrulama
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/yeni yetenek ekle/i)).toBeInTheDocument();
  });

  it('should call onChange with the new skill when user presses Enter', () => {
    // Hazırlık
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/yeni yetenek ekle/i);

    // Eylem
    fireEvent.change(input, { target: { value: 'Jest' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Doğrulama
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith([...mockSkills, { name: 'Jest' }]);
  });

  it('should not add a duplicate skill', () => {
    // Hazırlık
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/yeni yetenek ekle/i);

    // Eylem
    fireEvent.change(input, { target: { value: 'React' } }); // Zaten var olan bir yetenek
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Doğrulama
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should call onChange with the updated list when a skill is removed', () => {
    // Hazırlık
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    
    // 'React' yeteneğinin yanındaki silme butonunu bul
    const reactSkillElement = screen.getByText('React');
    const removeButton = reactSkillElement.nextElementSibling; // Silme butonu (×)

    // Eylem
    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton!);

    // Doğrulama
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith([{ name: 'TypeScript' }]); // Sadece TypeScript kalmalı
  });
});
