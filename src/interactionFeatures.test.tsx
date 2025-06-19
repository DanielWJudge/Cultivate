import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsGrid from './ContactsGrid';
import LogInteractionModal from './LogInteractionModal';
import ContactDetailModal from './ContactDetailModal';
import * as useDatabaseModule from './useDatabase';
import type { Contact, Interaction } from './db';

const baseContact: Contact = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '555-111-2222',
  company: 'Test Co',
  title: 'Tester',
  relationshipStrength: 7,
  cadence: 'monthly',
  notes: 'Some notes',
  howWeMet: 'Event',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseInteraction: Interaction = {
  id: 'i1',
  contactId: '1',
  date: new Date('2025-06-19T00:00:00'),
  channel: 'Email',
  notes: 'Initial touch',
  createdAt: new Date('2025-06-19T00:00:00'),
};

describe('Interaction Logging Features', () => {
  let addInteraction: ReturnType<typeof vi.fn>;
  let getContacts: ReturnType<typeof vi.fn>;
  let getInteractions: ReturnType<typeof vi.fn>;
  let updateContact: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addInteraction = vi.fn();
    getContacts = vi.fn();
    getInteractions = vi.fn();
    updateContact = vi.fn();
    vi.spyOn(useDatabaseModule, 'useDatabase').mockReturnValue({
      addInteraction,
      getContacts,
      getInteractions,
      updateContact,
      deleteContact: vi.fn(),
      addContact: vi.fn(),
      updateInteraction: vi.fn(),
      deleteInteraction: vi.fn(),
      db: {} as any,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('can log interactions from contact card', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([baseContact]); return { unsubscribe: () => {} }; } });
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb([]); return { unsubscribe: () => {} }; } });
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    const logBtn = screen.getByRole('button', { name: /log interaction/i });
    fireEvent.click(logBtn);
    expect(screen.getByRole('dialog', { name: /log interaction/i })).toBeInTheDocument();
  });

  it('shows interaction history in contact detail, most recent first', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([baseContact]); return { unsubscribe: () => {} }; } });
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb([
      { ...baseInteraction, id: 'i1', date: new Date('2025-06-18T00:00:00') },
      { ...baseInteraction, id: 'i2', date: new Date('2025-06-19T00:00:00') },
    ]); return { unsubscribe: () => {} }; } });
    render(<ContactDetailModal open={true} onClose={() => {}} contact={baseContact} />);
    expect(screen.getByText('Interaction History')).toBeInTheDocument();
    const items = screen.getAllByText(/channel:/i);
    expect(items.length).toBe(2);
    // Most recent first
    const dateNodes = screen.getAllByText(/date:/i);
    expect(dateNodes[0].parentElement?.textContent).toMatch(/6\/?19\/?2025/);
  });

  it('last touch date updates automatically after logging', async () => {
    let interactions: Interaction[] = [];
    let updateInteractions: ((arr: Interaction[]) => void) | undefined;
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([baseContact]); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation(() => ({
      subscribe: (cb: (arr: Interaction[]) => void) => {
        cb(interactions);
        updateInteractions = (arr) => { interactions = arr; cb(interactions); };
        return { unsubscribe: () => {} };
      }
    }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Simulate new interaction
    updateInteractions?.([
      { ...baseInteraction, date: new Date('2025-06-19T00:00:00') },
    ]);
    await waitFor(() => {
      const last = screen.getByText(/last interaction/i).textContent;
      if (last?.includes('—')) throw new Error('Last interaction did not update');
    });
  });

  it('shows empty state for no interactions in contact detail', () => {
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb([]); return { unsubscribe: () => {} }; } });
    render(<ContactDetailModal open={true} onClose={() => {}} contact={baseContact} />);
    expect(screen.getByText(/no interactions yet/i)).toBeInTheDocument();
  });

  it('log interaction modal validates required fields', async () => {
    render(<LogInteractionModal open={true} onClose={() => {}} contacts={[baseContact]} defaultContactId={baseContact.id} />);
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /log interaction/i }));
    expect(await screen.findByText(/date is required/i)).toBeInTheDocument();
  });
});
