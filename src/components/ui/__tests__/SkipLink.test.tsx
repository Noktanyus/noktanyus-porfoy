/**
 * SkipLink — Unit Test
 *
 * Test edilenler:
 *   - sr-only class default durumda
 *   - href, label, id baglantilari
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '../SkipLink';
import { SKIP_TARGET_ID, SKIP_LINK_LABEL } from '@/lib/a11y';

describe('SkipLink', () => {
  it('renders an anchor with correct text and href', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: SKIP_LINK_LABEL });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `#${SKIP_TARGET_ID}`);
  });

  it('hides visually by default (sr-only)', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: SKIP_LINK_LABEL });
    expect(link.className).toContain('sr-only');
  });
});