import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageUpload } from '../ImageUpload';

// react-hot-toast mock
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// global fetch mock
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('ImageUpload', () => {
  it('renders upload zone with hidden file input', () => {
    const { container } = render(<ImageUpload onChange={() => {}} />);
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('shows placeholder text when no value is set', () => {
    render(<ImageUpload onChange={() => {}} placeholder="Test placeholder" />);
    expect(screen.getByText('Test placeholder')).toBeInTheDocument();
  });

  it('shows preview image when value is set', () => {
    const { container } = render(
      <ImageUpload value="https://example.com/image.jpg" onChange={() => {}} />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('example.com');
  });

  it('renders URL fallback input', () => {
    render(<ImageUpload value="https://test.com/x.png" onChange={() => {}} />);
    const urlInput = screen.getByPlaceholderText('https://...');
    expect(urlInput).toBeInTheDocument();
    expect((urlInput as HTMLInputElement).value).toBe('https://test.com/x.png');
  });

  it('renders file selection button', () => {
    render(<ImageUpload onChange={() => {}} />);
    expect(screen.getByText('Dosya Seç')).toBeInTheDocument();
  });

  it('uses default props when not provided', () => {
    const { container } = render(<ImageUpload onChange={() => {}} />);
    // Should not throw and should render something
    expect(container).toBeTruthy();
  });
});
