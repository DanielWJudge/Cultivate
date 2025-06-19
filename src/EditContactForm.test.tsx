import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditContactForm from './EditContactForm';
import type { Contact } from './db';

const baseContact: Contact = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '',
  company: '',
  title: '',
  relationshipStrength: 5,
  cadence: 'monthly',
  notes: '',
  howWeMet: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EditContactForm', () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn();
    onCancel = vi.fn();
  });

  it('shows validation error for missing name', () => {
    render(<EditContactForm contact={{ ...baseContact, name: '' }} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', () => {
    render(<EditContactForm contact={baseContact} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits successfully', () => {
    render(<EditContactForm contact={baseContact} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
  });

  it('calls onCancel when cancel is clicked', () => {
    render(<EditContactForm contact={baseContact} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('is accessible: labels and ARIA', () => {
    render(<EditContactForm contact={baseContact} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relationship strength/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('handles long names and special characters', () => {
    render(<EditContactForm contact={baseContact} onSave={onSave} onCancel={onCancel} />);
    const longName = 'A'.repeat(100) + ' !@#$%^&*()_+';
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: longName } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: longName }));
  });
});
