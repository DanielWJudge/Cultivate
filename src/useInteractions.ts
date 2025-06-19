import { useCallback, useMemo, useRef } from 'react';
import { liveQuery } from 'dexie';
import { CRMDatabase } from './db';
import type { Interaction } from './db';

export function useInteractions<T extends { id: string } = Interaction>(contactId: string) {
  const dbRef = useRef<CRMDatabase | null>(null);
  if (!dbRef.current) dbRef.current = new CRMDatabase();
  const db = dbRef.current;

  // Fetch all interactions for a contact
  const getInteractions = useCallback(() => {
    return liveQuery(() => db.interactions.where('contactId').equals(contactId).toArray() as Promise<T[]>);
  }, [db, contactId]);

  // Calculate last touch date
  const getLastTouch = useCallback(async (): Promise<Date | undefined> => {
    const interactions = await db.interactions.where('contactId').equals(contactId).toArray();
    if (!interactions.length) return undefined;
    return interactions.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b).date;
  }, [db, contactId]);

  // Add interaction
  const addInteraction = useCallback(async (interaction: T) => {
    await db.interactions.add(interaction as Interaction);
  }, [db]);

  // Delete interaction
  const deleteInteraction = useCallback(async (id: string) => {
    await db.interactions.delete(id);
  }, [db]);

  return useMemo(() => ({
    getInteractions,
    getLastTouch,
    addInteraction,
    deleteInteraction,
  }), [getInteractions, getLastTouch, addInteraction, deleteInteraction]);
}
