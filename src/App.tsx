import React, { useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { generateSeedContacts, generateSeedInteractions } from './db';
import './App.css';
import ContactsGrid from './ContactsGrid';
import AddContactModalButton from './AddContactModalButton';
import Dashboard from './Dashboard';
import ContactDetailModal from './ContactDetailModal';
import SetupInstructions from './SetupInstructions';
import type { Contact } from './db';

function DemoDataLoader() {
  const { db, getContacts, addContact, addInteraction } = useDatabase();

  useEffect(() => {
    // Only seed if empty
    getContacts().subscribe(async (contacts) => {
      if (contacts.length === 0) {
        const seed = generateSeedContacts();
        const interactions = generateSeedInteractions();
        for (const contact of seed) {
          await addContact(contact);
        }
        for (const interaction of interactions) {
          await addInteraction(interaction);
        }
        // eslint-disable-next-line no-console
        console.log('Seeded demo contacts:', seed);
        // eslint-disable-next-line no-console
        console.log('Seeded demo interactions:', interactions);
      } else {
        // eslint-disable-next-line no-console
        console.log('Contacts in DB:', contacts);
      }
    });
  }, [getContacts, addContact, addInteraction]);

  return null;
}

function App() {
  const [page, setPage] = React.useState<'dashboard' | 'contacts'>('dashboard');
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  return (
    <>
      <DemoDataLoader />
      <SetupInstructions />
      {page === 'dashboard' ? (
        <>
          <Dashboard onOverdueContactClick={c => setSelectedContact(c)} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button style={{ fontSize: '1.1rem', padding: '0.5rem 1.5rem', background: '#2a7d46', color: '#fff', border: 'none', borderRadius: 6, marginTop: 16, cursor: 'pointer' }} onClick={() => setPage('contacts')}>
              View All Contacts
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button style={{ fontSize: '1.1rem', padding: '0.5rem 1.5rem', background: '#0077cc', color: '#fff', border: 'none', borderRadius: 6, marginBottom: 16, cursor: 'pointer' }} onClick={() => setPage('dashboard')}>
              Back to Dashboard
            </button>
          </div>
          <AddContactModalButton />
          <ContactsGrid />
        </>
      )}
      <ContactDetailModal open={!!selectedContact} onClose={() => setSelectedContact(null)} contact={selectedContact} />
    </>
  );
}

export default App;
