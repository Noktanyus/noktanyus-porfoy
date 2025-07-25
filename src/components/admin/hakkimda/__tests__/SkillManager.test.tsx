// src/components/admin/hakkimda/__tests__/SkillManager.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillManager from '../SkillManager';
import { Skill } from '@/types/content';

// next/image'ı mock'la
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="" />;
  },
}));

describe('SkillManager', () => {
  const mockSkills: Skill[] = [
    { id: '1', name: 'React', icon: 'FaReact', aboutId: 'about1' },
    { id: '2', name: 'TypeScript', icon: 'SiTypescript', aboutId: 'about1' },
  ];

  it('should render initial skills and input correctly', () => {
    render(<SkillManager skills={mockSkills} onChange={jest.fn()} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Örn: Docker')).toBeInTheDocument();
  });

  it('should call onChange with the new skill when user clicks Add button', () => {
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Örn: Docker');
    const addButton = screen.getByRole('button', { name: /Ekle/i });

    fireEvent.change(input, { target: { value: 'Jest' } });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockSkills,
        expect.objectContaining({ name: 'Jest' }),
      ])
    );
  });

  it('should not add a duplicate skill', () => {
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Örn: Docker');
    const addButton = screen.getByRole('button', { name: /Ekle/i });

    fireEvent.change(input, { target: { value: 'React' } }); // Zaten var
    fireEvent.click(addButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should call onChange with the updated list when a skill is removed', () => {
    const mockOnChange = jest.fn();
    render(<SkillManager skills={mockSkills} onChange={mockOnChange} />);
    
    // 'React' yeteneğinin bulunduğu satırdaki silme butonunu bul
    const reactSkillElement = screen.getByText('React').closest('div');
    const removeButton = reactSkillElement?.querySelector('button[aria-label="Yetkinliği sil"]');
    
    expect(removeButton).toBeInTheDocument();
    if(removeButton) {
      fireEvent.click(removeButton);
    }

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // Sadece TypeScript'in kaldığını doğrula
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ name: 'React' })])
    );
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'TypeScript' })])
    );
  });
});
