import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders the trigger child', () => {
    render(
      <Tooltip content="Hello info">
        <button>Trigger</button>
      </Tooltip>
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('does not show the tooltip content initially', () => {
    render(
      <Tooltip content="Hello info">
        <button>Trigger</button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the tooltip content on hover', () => {
    render(
      <Tooltip content="Hello info">
        <button>Trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hello info');
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the tooltip content on focus', () => {
    render(
      <Tooltip content="Focused info">
        <button>FocusButton</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole('button', { name: 'FocusButton' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focused info');
  });

  it('toggles the tooltip content on click when trigger=click', () => {
    render(
      <Tooltip content="Clicked info" trigger="click">
        <button>ClickButton</button>
      </Tooltip>
    );
    fireEvent.click(screen.getByRole('button', { name: 'ClickButton' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Clicked info');
    fireEvent.click(screen.getByRole('button', { name: 'ClickButton' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hides tooltip on outside click when trigger=click', () => {
    render(
      <div>
        <Tooltip content="Outside-test" trigger="click">
          <button>InsideBtn</button>
        </Tooltip>
        <button>OutsideBtn</button>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'InsideBtn' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'OutsideBtn' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
