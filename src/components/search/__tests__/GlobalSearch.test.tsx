import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSearch, OPEN_EVENT } from '../GlobalSearch';

// next/navigation router spy
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// fetch stub
const fetchMock = vi.fn();
const originalFetch = global.fetch;

describe('GlobalSearch', () => {
  beforeEach(() => {
    pushMock.mockClear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    // matchMedia already mocked in setup
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders closed state by default (only trigger button)', () => {
    render(<GlobalSearch />);
    const trigger = screen.getByRole('button', { name: /aramayı aç/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modal when trigger button is clicked', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    expect(screen.getByRole('dialog', { name: /global arama/i })).toBeInTheDocument();
  });

  it('opens modal when Ctrl+K is pressed', () => {
    render(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal when OPEN_EVENT is dispatched', async () => {
    render(<GlobalSearch />);
    window.dispatchEvent(new Event(OPEN_EVENT));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes modal when backdrop is clicked', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal when Escape is pressed', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses the search input when opened', async () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/arama terimi/i)).toHaveFocus();
    });
  });

  it('shows empty state when query is shorter than 2 chars', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    fireEvent.change(screen.getByLabelText(/arama terimi/i), {
      target: { value: 'a' },
    });
    expect(screen.getByText(/en az 2 karakter/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches results with debounce when at least 2 chars entered', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { blog: [], project: [], product: [], plan: [], total: 0 },
      }),
    } as Response);

    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    fireEvent.change(screen.getByLabelText(/arama terimi/i), {
      target: { value: 'next' },
    });

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/search?q=next'),
          expect.any(Object)
        );
      },
      { timeout: 1000 }
    );
  });

  it('shows no-results message when API returns empty', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { blog: [], project: [], product: [], plan: [], total: 0 },
      }),
    } as Response);

    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    fireEvent.change(screen.getByLabelText(/arama terimi/i), {
      target: { value: 'asdqwe' },
    });

    await waitFor(() => {
      expect(screen.getByText(/için sonuç bulunamadı/i)).toBeInTheDocument();
    });
  });

  it('renders results grouped by section when API returns data', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          blog: [
            {
              type: 'blog',
              id: 'b1',
              slug: 'hello-world',
              title: 'Hello World',
              description: 'A test blog',
              thumbnail: null,
              category: 'tech',
            },
          ],
          project: [
            {
              type: 'project',
              id: 'p1',
              slug: 'proj-1',
              title: 'Project One',
              description: 'desc',
              thumbnail: null,
              technologies: [],
            },
          ],
          product: [],
          plan: [],
          total: 2,
        },
      }),
    } as Response);

    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    fireEvent.change(screen.getByLabelText(/arama terimi/i), {
      target: { value: 'hello' },
    });

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
  });

  it('navigates to result URL when clicked', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          blog: [
            {
              type: 'blog',
              id: 'b1',
              slug: 'hello-world',
              title: 'Hello World',
              description: 'A test blog',
              thumbnail: null,
              category: 'tech',
            },
          ],
          project: [],
          product: [],
          plan: [],
          total: 1,
        },
      }),
    } as Response);

    render(<GlobalSearch />);
    fireEvent.click(screen.getByRole('button', { name: /aramayı aç/i }));
    fireEvent.change(screen.getByLabelText(/arama terimi/i), {
      target: { value: 'hello' },
    });

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hello World'));
    expect(pushMock).toHaveBeenCalledWith('/blog/hello-world');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});