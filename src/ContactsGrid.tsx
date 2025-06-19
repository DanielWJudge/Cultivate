import React from 'react';
import { useDatabase } from './useDatabase';
import type { Contact, Interaction } from './db';
import styles from './ContactsGrid.module.css';

function formatDate(date?: Date | string) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleDateString() ?? '—';
}

interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date | string;
}

function ContactsList() {
  const { getContacts, getInteractions } = useDatabase();
  const [contacts, setContacts] = React.useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const sub = getContacts().subscribe(async (contacts) => {
      const withLast: ContactWithLastInteraction[] = await Promise.all(
        contacts.map(async (contact) => {
          let last: Interaction | undefined;
          const interactions = await new Promise<Interaction[]>((resolve) => {
            getInteractions(contact.id).subscribe((data) => resolve(data));
          });
          if (interactions.length) {
            last = interactions.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
          }
          return { ...contact, lastInteraction: last?.date };
        })
      );
      setContacts(withLast);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, [getContacts, getInteractions]);

  if (loading) return <div className={styles.loading}>Loading contacts…</div>;
  if (!contacts.length) return <div className={styles.empty}>No contacts found.</div>;

  return (
    <div className={styles.grid}>
      {contacts.map((c) => (
        <div className={styles.card} key={c.id}>
          <div className={styles.name}>{c.name}</div>
          <div className={styles.company}>{c.company}</div>
          <div className={styles.strength}>Relationship: {c.relationshipStrength}/10</div>
          <div className={styles.lastInteraction}>
            Last interaction: {formatDate(c.lastInteraction as Date | string | undefined)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContactsGrid() {
  return (
    <div className={styles.container}>
      <h2>Contacts</h2>
      <ContactsList />
    </div>
  );
}
