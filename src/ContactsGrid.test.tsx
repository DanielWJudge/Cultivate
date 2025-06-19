import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ContactsGrid from './ContactsGrid';
import * as useDatabaseModule from './useDatabase';
import type { Contact, Interaction } from './db';

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-111-2222',
    company: 'Test Co',
    title: 'Tester',
    relationshipStrength: 7,
    cadence: 'monthly',
    notes: '',
    howWeMet: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
const mockInteractions: Interaction[] = [
  {
    id: 'i1',
    contactId: '1',
    date: new Date('2024-01-01'),
    channel: 'email',
    notes: '',
    createdAt: new Date('2024-01-01'),
  },
];

function makeMockDatabase(overrides: Partial<ReturnType<typeof useDatabaseModule.useDatabase>> = {}) {
  return {
    db: {} as any,
    addContact: vi.fn(),
    getContacts: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    addInteraction: vi.fn(),
    getInteractions: vi.fn(),
    updateInteraction: vi.fn(),
    deleteInteraction: vi.fn(),
    ...overrides,
  };
}

describe('ContactsGrid', () => {
  let getContacts: ReturnType<typeof vi.fn>;
  let getInteractions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getContacts = vi.fn();
    getInteractions = vi.fn(() => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb([]); return { unsubscribe: () => {} }; } }));
    vi.spyOn(useDatabaseModule, 'useDatabase').mockReturnValue(
      makeMockDatabase({ getContacts, getInteractions })
    );
  });

  it('shows loading state', () => {
    getContacts.mockReturnValue({ subscribe: (_cb: (contacts: Contact[]) => void) => ({ unsubscribe: () => {} }) });
    render(<ContactsGrid />);
    expect(screen.getByText(/loading contacts/i)).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([]); return { unsubscribe: () => {} }; } });
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText(/no contacts found/i)).toBeInTheDocument());
  });

  it('displays contact data', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb(mockContacts); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    expect(screen.getByText('Test Co')).toBeInTheDocument();
    expect(screen.getByText(/relationship: 7\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/last interaction/i)).toBeInTheDocument();
  });

  it('is accessible', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb(mockContacts); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Check for role and heading
    expect(screen.getByRole('heading', { name: /contacts/i })).toBeInTheDocument();
    // Each card should be present
    const cards = screen.getAllByText('Test User');
    expect(cards.length).toBeGreaterThan(0);
  });
});
