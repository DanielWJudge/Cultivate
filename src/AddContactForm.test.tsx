import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddContactForm from './AddContactForm';
import * as useDatabaseModule from './useDatabase';

const mockAddContact = vi.fn();

describe('AddContactForm', () => {
  beforeEach(() => {
    vi.spyOn(useDatabaseModule, 'useDatabase').mockReturnValue({
      addContact: mockAddContact,
    } as any);
    mockAddContact.mockReset();
  });

  it('shows validation error for missing name', async () => {
    render(<AddContactForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<AddContactForm />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('submits successfully and resets form', async () => {
    mockAddContact.mockResolvedValue(undefined);
    render(<AddContactForm />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    await waitFor(() => expect(mockAddContact).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent(/contact added/i);
    // Form resets
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('');
  });

  it('is accessible: labels and ARIA', () => {
    render(<AddContactForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relationship strength/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument();
    // ARIA attributes
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-describedby');
  });

  it('handles long names and special characters', async () => {
    mockAddContact.mockResolvedValue(undefined);
    render(<AddContactForm />);
    const longName = 'A'.repeat(100) + ' !@#$%^&*()_+';
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: longName } });
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    await waitFor(() => expect(mockAddContact).toHaveBeenCalledWith(expect.objectContaining({ name: longName })));
    expect(screen.getByRole('status')).toHaveTextContent(/contact added/i);
  });
});
