import React, { useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { generateSeedContacts } from './db';
import './App.css';

function DemoDataLoader() {
  const { db, getContacts, addContact } = useDatabase();

  useEffect(() => {
    // Only seed if empty
    getContacts().subscribe(async (contacts) => {
      if (contacts.length === 0) {
        const seed = generateSeedContacts();
        for (const contact of seed) {
          await addContact(contact);
        }
        // eslint-disable-next-line no-console
        console.log('Seeded demo contacts:', seed);
      } else {
        // eslint-disable-next-line no-console
        console.log('Contacts in DB:', contacts);
      }
    });
  }, [getContacts, addContact]);

  return null;
}

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '2rem' }}>
      <DemoDataLoader />
      Welcome to Cultivate
    </div>
  );
}

export default App;
