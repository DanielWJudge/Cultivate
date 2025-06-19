import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import SetupInstructions from './SetupInstructions';

function resetLocalStorage() {
  localStorage.removeItem('cultivate-setup-shown');
}

describe('SetupInstructions', () => {
  beforeEach(() => {
    resetLocalStorage();
  });
  afterEach(() => {
    resetLocalStorage();
  });

  it('shows instructions on first visit and hides on dismiss', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/welcome! set up cultivate/i)).toBeInTheDocument();
    expect(screen.getByText(/bookmark this app/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/welcome! set up cultivate/i)).not.toBeInTheDocument();
  });

  it('does not show instructions if already dismissed', () => {
    localStorage.setItem('cultivate-setup-shown', '1');
    render(<SetupInstructions />);
    expect(screen.queryByText(/welcome! set up cultivate/i)).not.toBeInTheDocument();
  });

  it('shows browser-specific instructions', () => {
    // Simulate Chrome
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Chrome', configurable: true });
    render(<SetupInstructions />);
    expect(screen.getByText(/chrome/i)).toBeInTheDocument();
    // There are multiple Ctrl+D instructions, so use getAllByText
    const bookmarkShortcuts = screen.getAllByText(/ctrl\+d/i);
    expect(bookmarkShortcuts.length).toBeGreaterThan(0);
    // There are also multiple homepage instructions, so use getAllByText
    const homepageInstructions = screen.getAllByText(/on startup/i);
    expect(homepageInstructions.length).toBeGreaterThan(0);
  });
});
