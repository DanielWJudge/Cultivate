import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import ContactsGrid from './ContactsGrid';
import AddContactModalButton from './AddContactModalButton';
import * as useDatabaseModule from './useDatabase';
import type { Contact, Interaction, CRMDatabase } from './db';
import userEvent from '@testing-library/user-event';

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

function makeMockDatabase(
  overrides: Partial<ReturnType<typeof useDatabaseModule.useDatabase>> = {}
): ReturnType<typeof useDatabaseModule.useDatabase> {
  // Minimal dummy Dexie classes for type compatibility
  function Dummy() {}
  // Minimal Dexie Table mock with all required properties
  const tableMock = {
    get db() {
      return mockDb;
    },
    name: '',
    schema: {},
    hook: {},
    toArray: () => Promise.resolve([]),
    add: () => Promise.resolve(),
    get: () => Promise.resolve(undefined),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    clear: () => Promise.resolve(),
    where: () => ({ equals: () => ({ toArray: () => Promise.resolve([]) }) }),
    core: {},
    filter: () => tableMock,
    count: () => Promise.resolve(0),
    offset: () => tableMock,
    limit: () => tableMock,
    reverse: () => tableMock,
    each: () => {},
    orderBy: () => tableMock,
    bulkAdd: () => Promise.resolve(),
    bulkPut: () => Promise.resolve(),
    bulkDelete: () => Promise.resolve(),
    mapToClass: () => tableMock,
    and: () => tableMock,
    first: () => Promise.resolve(undefined),
    last: () => Promise.resolve(undefined),
    modify: () => Promise.resolve(),
    toCollection: () => tableMock,
    update: () => Promise.resolve(),
    bulkGet: () => Promise.resolve([]),
    bulkUpdate: () => Promise.resolve(),
  };

  const mockDb = {
    contacts: tableMock,
    interactions: tableMock,
    name: 'mock-db',
    tables: [],
    verno: 1,
    open: () => Promise.resolve(),
    close: () => {},
    isOpen: () => true,
    on: { versionchange: { subscribe: () => {} } },
    transaction: () => ({ abort: () => {} }),
    // Dexie internal/required properties (dummy implementations)
    vip: false,
    _novip: false,
    _allTables: [],
    core: {},
    _createTransaction: () => ({}),
    _whenReady: () => Promise.resolve(),
    _onAccessError: () => {},
    _on: () => {},
    _parseStoresSpec: () => ({}),
    _dbSchema: {},
    _options: {},
    _middlewares: [],
    _state: {},
    _reculock: {},
    _fireOnBlocked: () => {},
    _fireOnVersionChange: () => {},
    _fireOnReady: () => {},
    _fireOnPopulate: () => {},
    _fireOnClosed: () => {},
    _fireOnError: () => {},
    _fireOnBlockedEvent: () => {},
    _fireOnVersionChangeEvent: () => {},
    _fireOnReadyEvent: () => {},
    _fireOnPopulateEvent: () => {},
    _fireOnClosedEvent: () => {},
    _fireOnErrorEvent: () => {},
    // Dexie public API dummies
    version: () => mockDb,
    table: () => tableMock,
    delete: () => Promise.resolve(),
    backendDB: {},
    hasBeenClosed: false,
    hasFailed: false,
    dynamicallyOpened: false,
    use: () => {},
    unuse: () => {},
    backendDBClosed: false,
    closeBackend: () => {},
    openBackend: () => {},
    // Dexie static classes for type compatibility
    Table: Dummy,
    WhereClause: Dummy,
    Version: Dummy,
    Transaction: Dummy,
    Collection: Dummy,
  } as unknown as CRMDatabase;

  return {
    db: mockDb,
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
    getContacts.mockReturnValue({ subscribe: () => ({ unsubscribe: () => {} }) });
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

  it('contact cards are keyboard accessible and have correct ARIA roles', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb(mockContacts); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Card is a button
    const card = screen.getByRole('button', { name: /view details for test user/i });
    expect(card).toBeInTheDocument();
    // Name is a link
    const nameLink = screen.getByRole('link', { name: /view details for test user/i });
    expect(nameLink).toBeInTheDocument();
    // Status indicator has aria-label (at least one)
    const statuses = screen.getAllByLabelText(/ok|overdue|due soon/i);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it('all action buttons are accessible and labeled', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb(mockContacts); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Edit, Delete, Log Interaction buttons
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log interaction/i })).toBeInTheDocument();
  });

  it('modals have aria-labels and are accessible', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb(mockContacts); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Open edit modal
    await act(async () => {
      screen.getByRole('button', { name: /edit/i }).click();
    });
    // Wait for dialog to appear
    const editDialogs = await screen.findAllByRole('dialog', { name: /edit contact/i });
    expect(editDialogs.length).toBeGreaterThan(0);
    // Open delete modal
    await act(async () => {
      screen.getByRole('button', { name: /delete/i }).click();
    });
    const deleteDialogs = await screen.findAllByRole('dialog', { name: /delete contact confirmation/i });
    expect(deleteDialogs.length).toBeGreaterThan(0);
  });

  it('shows a warning for unsupported cadence in UI', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([
      { ...mockContacts[0], cadence: 'bad' },
    ]); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation((id: string) => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb(mockInteractions.filter(i => i.contactId === id)); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    // Should show a warning or fallback for due date
    expect(screen.getByText(/unsupported cadence|invalid cadence|no due date/i)).toBeInTheDocument();
  });
});

describe('ContactsGrid integration', () => {
  let getContacts: ReturnType<typeof vi.fn>;
  let getInteractions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getContacts = vi.fn();
    getInteractions = vi.fn();
    vi.spyOn(useDatabaseModule, 'useDatabase').mockReturnValue(
      makeMockDatabase({ getContacts, getInteractions })
    );
  });

  it('can add a new contact and see it in the list', async () => {
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([]); return { unsubscribe: () => {} }; } });
    getInteractions.mockImplementation(() => ({ subscribe: (cb: (interactions: Interaction[]) => void) => { cb([]); return { unsubscribe: () => {} }; } }));
    render(<ContactsGrid />);
    // Simulate clicking Add Contact button in the main app
    render(<AddContactModalButton />);
    await userEvent.click(screen.getAllByRole('button', { name: /add contact/i })[0]); // open modal
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/name/i), 'Integration User');
    await userEvent.type(screen.getByLabelText(/email/i), 'integration@example.com');
    await userEvent.type(screen.getByLabelText(/company/i), 'Integration Co');
    await userEvent.type(screen.getByLabelText(/title/i), 'Integrator');
    await userEvent.type(screen.getByLabelText(/relationship strength/i), '8');
    // Click the submit button (the second Add Contact button)
    await userEvent.click(screen.getAllByRole('button', { name: /add contact/i })[1]);
    // Should show success or close modal
    // (simulate DB update)
    getContacts.mockReturnValue({ subscribe: (cb: (contacts: Contact[]) => void) => { cb([
      { ...mockContacts[0], name: 'Integration User', email: 'integration@example.com', company: 'Integration Co', title: 'Integrator', relationshipStrength: 8 },
    ]); return { unsubscribe: () => {} }; } });
    // Re-render grid to reflect new contact
    render(<ContactsGrid />);
    await waitFor(() => expect(screen.getByText('Integration User')).toBeInTheDocument());
  });

  it('can filter to show only overdue contacts', async () => {
    const user = userEvent.setup();
    const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => new Date('2025-06-19').getTime());

    // --- Mocks ---
    let contactsSubscriber: (contacts: Contact[]) => void = () => {};
    const contactsObservable = {
      subscribe: (cb: (contacts: Contact[]) => void) => {
        contactsSubscriber = cb;
        return { unsubscribe: () => {} };
      },
    };
    getContacts.mockReturnValue(contactsObservable);

    let interactionsSubscriber: (interactions: Interaction[]) => void = () => {};
    const interactionsObservable = {
        subscribe: (cb: (interactions: Interaction[]) => void) => {
            interactionsSubscriber = cb;
            return { unsubscribe: () => {} };
        }
    };
    getInteractions.mockReturnValue(interactionsObservable);

    // --- Render ---
    render(<ContactsGrid />);

    // --- Initial State ---
    act(() => {
        contactsSubscriber([
            { ...mockContacts[0], id: '1', name: 'Overdue User', cadence: 'monthly' },
            { ...mockContacts[0], id: '2', name: 'On Time User', cadence: 'monthly' },
        ]);
        interactionsSubscriber([
            // Overdue: last seen Apr 15, due May 15. "Now" is Jun 19.
            { ...mockInteractions[0], contactId: '1', date: new Date('2025-04-15') },
            // On time: last seen May 25, due Jun 25. "Now" is Jun 19.
            { ...mockInteractions[0], contactId: '2', date: new Date('2025-05-25') },
        ]);
    });

    expect(await screen.findByText('Overdue User')).toBeInTheDocument();
    expect(await screen.findByText('On Time User')).toBeInTheDocument();

    // --- Filter ---
    const overdueCheckbox = screen.getByLabelText(/overdue only/i);
    await user.click(overdueCheckbox);

    // --- Assertions ---
    await waitFor(() => {
      expect(screen.queryByText('On Time User')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Overdue User')).toBeInTheDocument();

    // --- Un-filter ---
    await user.click(overdueCheckbox);
    expect(await screen.findByText('On Time User')).toBeInTheDocument();

    dateNowSpy.mockRestore();
  });

  it('can sort contacts by name', async () => {
    const user = userEvent.setup();
    const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => new Date('2025-02-01').getTime());

    let contactsSubscriber: (contacts: Contact[]) => void = () => {};
    const contactsObservable = {
      subscribe: (cb: (contacts: Contact[]) => void) => {
        contactsSubscriber = cb;
        return { unsubscribe: () => {} };
      },
    };
    getContacts.mockReturnValue(contactsObservable);

    let interactionsSubscriber: (interactions: Interaction[]) => void = () => {};
    const interactionsObservable = {
        subscribe: (cb: (interactions: Interaction[]) => void) => {
            interactionsSubscriber = cb;
            return { unsubscribe: () => {} };
        }
    };
    getInteractions.mockReturnValue(interactionsObservable);

    render(<ContactsGrid />);

    act(() => {
        contactsSubscriber([
            { ...mockContacts[0], id: '1', name: 'Zed', cadence: 'monthly' },
            { ...mockContacts[0], id: '2', name: 'Alice', cadence: 'monthly' },
        ]);
        interactionsSubscriber([
            // Zed is due sooner (Jan 10 -> Feb 10)
            {...mockInteractions[0], contactId: '1', date: new Date('2025-01-10')},
            // Alice is due later (Jan 20 -> Feb 20)
            {...mockInteractions[0], contactId: '2', date: new Date('2025-01-20')},
        ]);
    });

    // Initial order should be Zed then Alice based on urgency (due date)
    await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /view details for/i });
        expect(links[0]).toHaveTextContent('Zed');
        expect(links[1]).toHaveTextContent('Alice');
    });

    // There are now multiple comboboxes, so select the correct one for sort
    const sortSelects = screen.getAllByRole('combobox');
    // The sort select is after the filter selects, so pick the last one
    await user.selectOptions(sortSelects[sortSelects.length - 1], 'name');

    // New order should be Alice then Zed based on name
    await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /view details for/i });
        expect(links[0]).toHaveTextContent('Alice');
        expect(links[1]).toHaveTextContent('Zed');
    });
    
    dateNowSpy.mockRestore();
  });
});
