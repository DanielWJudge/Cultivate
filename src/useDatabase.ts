import { useCallback, useMemo, useRef } from 'react';
import { CRMDatabase } from './db';
import type { Contact, Interaction } from './db';
import { liveQuery } from 'dexie';

// Error boundary for async hooks
class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function useDatabase() {
  // Singleton Dexie instance
  const dbRef = useRef<CRMDatabase | null>(null);
  if (!dbRef.current) {
    dbRef.current = new CRMDatabase();
  }
  const db = dbRef.current;

  // CRUD methods for Contacts
  const addContact = useCallback(async (contact: Contact) => {
    try {
      await db.contacts.add(contact);
    } catch (e) {
      throw new DatabaseError('Failed to add contact: ' + (e as Error).message);
    }
  }, [db]);

  const getContacts = useCallback(() => {
    return liveQuery(() => db.contacts.toArray());
  }, [db]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      await db.contacts.update(id, updates);
    } catch (e) {
      throw new DatabaseError('Failed to update contact: ' + (e as Error).message);
    }
  }, [db]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await db.contacts.delete(id);
    } catch (e) {
      throw new DatabaseError('Failed to delete contact: ' + (e as Error).message);
    }
  }, [db]);

  // CRUD methods for Interactions
  const addInteraction = useCallback(async (interaction: Interaction) => {
    try {
      await db.interactions.add(interaction);
    } catch (e) {
      throw new DatabaseError('Failed to add interaction: ' + (e as Error).message);
    }
  }, [db]);

  const getInteractions = useCallback((contactId?: string) => {
    return liveQuery(() =>
      contactId
        ? db.interactions.where('contactId').equals(contactId).toArray()
        : db.interactions.toArray()
    );
  }, [db]);

  const updateInteraction = useCallback(async (id: string, updates: Partial<Interaction>) => {
    try {
      await db.interactions.update(id, updates);
    } catch (e) {
      throw new DatabaseError('Failed to update interaction: ' + (e as Error).message);
    }
  }, [db]);

  const deleteInteraction = useCallback(async (id: string) => {
    try {
      await db.interactions.delete(id);
    } catch (e) {
      throw new DatabaseError('Failed to delete interaction: ' + (e as Error).message);
    }
  }, [db]);

  // Suspense compatibility: return memoized API
  return useMemo(
    () => ({
      db,
      addContact,
      getContacts,
      updateContact,
      deleteContact,
      addInteraction,
      getInteractions,
      updateInteraction,
      deleteInteraction,
    }),
    [db, addContact, getContacts, updateContact, deleteContact, addInteraction, getInteractions, updateInteraction, deleteInteraction]
  );
}
