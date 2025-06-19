import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Dashboard from './Dashboard';
import * as useDatabaseModule from './useDatabase';
import type { Contact, Interaction } from './db';

const mockContacts: Contact[] = [
  { id: '1', name: 'Overdue User', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'On Time User', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: new Date(), updatedAt: new Date() },
];
const mockInteractions: Interaction[] = [
  { id: 'i1', contactId: '1', date: new Date('2024-01-01'), channel: 'email', notes: '', createdAt: new Date('2024-01-01') },
  { id: 'i2', contactId: '2', date: new Date(), channel: 'call', notes: '', createdAt: new Date() },
];

describe('Dashboard', () => {
  let getContacts: ReturnType<typeof vi.fn>;
  let getInteractions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getContacts = vi.fn();
    getInteractions = vi.fn();
    vi.spyOn(useDatabaseModule, 'useDatabase').mockReturnValue({
      getContacts,
      getInteractions,
    } as any);
  });

  it('shows loading states for widgets', () => {
    getContacts.mockReturnValue({ subscribe: () => ({ unsubscribe: () => {} }) });
    getInteractions.mockReturnValue({ subscribe: () => ({ unsubscribe: () => {} }) });
    render(<Dashboard />);
    expect(screen.getByText(/loading overdue contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/loading touches this month/i)).toBeInTheDocument();
    expect(screen.getByText(/loading recent interactions/i)).toBeInTheDocument();
  });

  it('shows overdue contacts and calls handler on click', async () => {
    let contactsCb: (contacts: Contact[]) => void = () => {};
    let interactionsCb: (interactions: Interaction[]) => void = () => {};
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { contactsCb = cb; return { unsubscribe: () => {} }; } });
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { interactionsCb = cb; return { unsubscribe: () => {} }; } });
    const onOverdueContactClick = vi.fn();
    render(<Dashboard onOverdueContactClick={onOverdueContactClick} />);
    await act(async () => {
      contactsCb(mockContacts);
      interactionsCb([ { ...mockInteractions[0], contactId: '1', date: new Date('2023-01-01') } ]); // Overdue
    });
    // Find the overdue contact button specifically
    const btn = screen.getByRole('button', { name: /overdue user.*overdue/i });
    btn.click();
    expect(onOverdueContactClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Overdue User' }));
  });

  it('shows touches this month and trend', async () => {
    let contactsCb: (contacts: Contact[]) => void = () => {};
    let interactionsCb: (interactions: Interaction[]) => void = () => {};
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { contactsCb = cb; return { unsubscribe: () => {} }; } });
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { interactionsCb = cb; return { unsubscribe: () => {} }; } });
    render(<Dashboard />);
    await act(async () => {
      contactsCb(mockContacts);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);
      interactionsCb([
        { ...mockInteractions[0], id: 'i3', date: now },
        { ...mockInteractions[1], id: 'i4', date: now },
        { ...mockInteractions[1], id: 'i5', date: lastMonth },
      ]);
    });
    await waitFor(() => expect(screen.getByText('Touches This Month')).toBeInTheDocument());
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/vs last month/i)).toBeInTheDocument();
  });

  it('shows recent interactions', async () => {
    let contactsCb: (contacts: Contact[]) => void = () => {};
    let interactionsCb: (interactions: Interaction[]) => void = () => {};
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { contactsCb = cb; return { unsubscribe: () => {} }; } });
    getInteractions.mockReturnValue({ subscribe: (cb: (interactions: Interaction[]) => void) => { interactionsCb = cb; return { unsubscribe: () => {} }; } });
    render(<Dashboard />);
    await act(async () => {
      contactsCb(mockContacts);
      interactionsCb([
        { ...mockInteractions[0], id: 'i6' },
        { ...mockInteractions[1], id: 'i7' },
      ]);
    });
    await waitFor(() => expect(screen.getByText('Recent Interactions')).toBeInTheDocument());
    expect(screen.getAllByText(/user/i).length).toBeGreaterThan(0);
  });
});
