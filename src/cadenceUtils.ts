// cadenceUtils.ts
import type { Contact, Interaction } from './db';

export type CadenceType = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export function getNextTouchDate(lastInteraction: Date, cadence: CadenceType | 'yearly'): Date {
  const d = new Date(lastInteraction);
  const origDay = d.getDate();
  // Accept 'yearly' as alias for 'annual'
  const normalizedCadence = cadence === 'yearly' ? 'annual' : cadence;
  let targetMonth = d.getMonth();
  let targetYear = d.getFullYear();
  switch (normalizedCadence) {
    case 'monthly':
      targetMonth += 1;
      break;
    case 'quarterly':
      targetMonth += 3;
      break;
    case 'semi-annual':
      targetMonth += 6;
      break;
    case 'annual':
      targetYear += 1;
      break;
    default:
      throw new Error(`Unknown cadence: ${cadence}`);
  }
  // Normalize month/year overflow
  if (targetMonth > 11) {
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = targetMonth % 12;
  }
  // Clamp to last day of target month
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(origDay, lastDay);
  return new Date(targetYear, targetMonth, day);
}

export function isOverdue(lastInteraction: Date, cadence: CadenceType, now: Date = new Date()): boolean {
  return getNextTouchDate(lastInteraction, cadence).getTime() <= now.getTime();
}

export interface ContactWithUrgency extends Contact {
  lastInteraction?: Date;
  nextTouch?: Date;
  overdue?: boolean;
  daysOverdue?: number;
}

export function annotateContacts(
  contacts: Contact[],
  interactions: Interaction[],
  now: Date = new Date()
): ContactWithUrgency[] {
  return contacts.map((contact) => {
    const relevant = interactions.filter(i => i.contactId === contact.id);
    const last = relevant.length ? relevant.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b) : undefined;
    const lastDate = last ? new Date(last.date) : undefined;
    let nextTouch: Date | undefined = undefined;
    let overdue = false;
    let daysOverdue = 0;
    let cadenceError = false;
    if (lastDate) {
      try {
        nextTouch = getNextTouchDate(lastDate, (contact.cadence === 'yearly' ? 'annual' : contact.cadence) as CadenceType);
        overdue = nextTouch.getTime() <= now.getTime();
        if (overdue) {
          daysOverdue = Math.ceil((now.getTime() - nextTouch.getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue < 1) daysOverdue = 1; // Should be at least 1 day overdue
        }
      } catch {
        nextTouch = undefined;
        cadenceError = true;
      }
    }
    return {
      ...contact,
      lastInteraction: lastDate,
      nextTouch,
      overdue,
      daysOverdue,
      cadenceError,
    };
  });
}

export function sortByUrgency(contacts: ContactWithUrgency[]): ContactWithUrgency[] {
  return [...contacts].sort((a, b) => {
    if (a.overdue && b.overdue) {
      return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
    }
    if (a.overdue) return -1;
    if (b.overdue) return 1;
    if (a.nextTouch && b.nextTouch) {
      return a.nextTouch.getTime() - b.nextTouch.getTime();
    }
    return 0;
  });
}
