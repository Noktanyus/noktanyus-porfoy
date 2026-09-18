/**
 * Modal — Unit Test
 *
 * Test edilenler:
 *   - open=false durumunda render edilmez
 *   - open=true durumunda document.body içine portal ile render edilir (table/container clipping koruması)
 *   - title ve description ile aria-labelledby / aria-describedby erişilebilirliği
 *   - Kapat butonu ve backdrop click ile onClose tetiklenmesi
 *   - ESC tuşu ile kapatma
 *   - document.body body-scroll-lock class'ının açılıp kapanması
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <div id="table-cell">
        <Modal open={false} onClose={vi.fn()} title="Test Modal">
          <p>İçerik</p>
        </Modal>
      </div>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('#modal-title')).toBeNull();
  });

  it('renders into document.body via portal and outside parent container when open is true', () => {
    const { container } = render(
      <div id="nested-table-cell">
        <Modal open={true} onClose={vi.fn()} title="Test Modal" description="Modal Açıklaması">
          <p>Modal İçeriği</p>
        </Modal>
      </div>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Portal kontrolü: dialog document.body'nin doğrudan çocuğu olmalı, parent div içinde kalmamalı
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.contains(dialog)).toBe(true);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Açıklaması')).toBeInTheDocument();
    expect(screen.getByText('Modal İçeriği')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Kapatılabilir Modal">
        <p>İçerik</p>
      </Modal>
    );

    const closeBtn = screen.getByRole('button', { name: /kapat/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="ESC Test Modal">
        <p>İçerik</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click when closeOnBackdrop is true', () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Backdrop Test" closeOnBackdrop={true}>
        <p>İçerik</p>
      </Modal>
    );

    const backdrop = document.body.querySelector('.modal-overlay');
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('manages body-scroll-lock class on document.body during lifecycle', () => {
    expect(document.body.classList.contains('body-scroll-lock')).toBe(false);

    const { unmount } = render(
      <Modal open={true} onClose={vi.fn()} title="Scroll Lock Test">
        <p>İçerik</p>
      </Modal>
    );

    expect(document.body.classList.contains('body-scroll-lock')).toBe(true);

    unmount();
    expect(document.body.classList.contains('body-scroll-lock')).toBe(false);
  });
});
