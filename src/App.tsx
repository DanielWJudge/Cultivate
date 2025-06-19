import React, { useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { generateSeedContacts, generateSeedInteractions } from './db';
import './App.css';
import ContactsGrid from './ContactsGrid';
import AddContactModalButton from './AddContactModalButton';

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
  return (
    <>
      <DemoDataLoader />
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '2rem' }}>
        Welcome to Cultivate
      </div>
      <AddContactModalButton />
      <ContactsGrid />
    </>
  );
}

export default App;
