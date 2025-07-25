// src/components/__tests__/SocialIcons.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialIcons from '../SocialIcons';

describe('SocialIcons', () => {
  const mockSocialData = {
    github: 'https://github.com/testuser',
    linkedin: 'https://linkedin.com/in/testuser',
    instagram: 'https://instagram.com/testuser',
  };

  it('should render all social media links when provided', async () => {
    render(<SocialIcons {...mockSocialData} />);

    await waitFor(() => {
      const githubLink = screen.getByRole('link', { name: /github/i });
      const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
      const instagramLink = screen.getByRole('link', { name: /instagram/i });

      expect(githubLink).toHaveAttribute('href', 'https://github.com/testuser');
      expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/testuser');
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/testuser');
    });
  });

  it('should open links in new tab', async () => {
    render(<SocialIcons {...mockSocialData} />);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  it('should not render links for missing social media URLs', async () => {
    render(<SocialIcons github="https://github.com/testuser" />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /linkedin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
    });
  });

  it('should render nothing when no social media URLs provided', () => {
    const { container } = render(<SocialIcons />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should have proper accessibility attributes', async () => {
    render(<SocialIcons {...mockSocialData} />);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });
});