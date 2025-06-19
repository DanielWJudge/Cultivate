import { describe, it, expect } from 'vitest';
import { getNextTouchDate, isOverdue, annotateContacts, sortByUrgency } from './cadenceUtils';
import type { CadenceType } from './cadenceUtils';

// Use local time for all test dates to match JS Date math
const baseDate = new Date(2025, 5, 1); // June 1, 2025 (month is 0-based)
const now = new Date(2025, 6, 1); // July 1, 2025

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

describe('cadenceUtils', () => {
  it('calculates next touch date for all cadence types', () => {
    expect(getNextTouchDate(baseDate, 'monthly')).toEqual(new Date(2025, 6, 1)); // July 1, 2025
    expect(getNextTouchDate(baseDate, 'quarterly')).toEqual(new Date(2025, 8, 1)); // Sep 1, 2025
    expect(getNextTouchDate(baseDate, 'semi-annual')).toEqual(new Date(2025, 11, 1)); // Dec 1, 2025
    expect(getNextTouchDate(baseDate, 'annual')).toEqual(new Date(2026, 5, 1)); // June 1, 2026
  });

  it('identifies overdue contacts', () => {
    expect(isOverdue(baseDate, 'monthly', now)).toBe(true);
    expect(isOverdue(addDays(baseDate, 40), 'monthly', now)).toBe(false);
  });

  it('annotates contacts with urgency info', () => {
    const contacts = [
      { id: '1', name: 'A', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
      { id: '2', name: 'B', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'quarterly', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
    ];
    const interactions = [
      { id: 'i1', contactId: '1', date: baseDate, channel: 'email', notes: '', createdAt: baseDate },
      { id: 'i2', contactId: '2', date: baseDate, channel: 'call', notes: '', createdAt: baseDate },
    ];
    const annotated = annotateContacts(contacts, interactions, now);
    expect(annotated[0].overdue).toBe(true);
    expect(annotated[1].overdue).toBe(false);
    expect(annotated[0].daysOverdue).toBeGreaterThan(0);
  });

  it('sorts contacts by urgency (most overdue first)', () => {
    const contacts = [
      { id: '1', name: 'A', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
      { id: '2', name: 'B', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
    ];
    const interactions = [
      { id: 'i1', contactId: '1', date: baseDate, channel: 'email', notes: '', createdAt: baseDate },
      { id: 'i2', contactId: '2', date: addDays(baseDate, 10), channel: 'call', notes: '', createdAt: baseDate },
    ];
    const annotated = annotateContacts(contacts, interactions, now);
    const sorted = sortByUrgency(annotated);
    expect(sorted[0].id).toBe('1'); // Most overdue first
  });

  it('handles edge cases: no interactions, unknown cadence', () => {
    const contacts = [
      { id: '1', name: 'A', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'monthly', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
      { id: '2', name: 'B', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'annual', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
    ];
    const interactions: [] = [];
    const annotated = annotateContacts(contacts, interactions, now);
    expect(annotated[0].lastInteraction).toBeUndefined();
    expect(annotated[1].lastInteraction).toBeUndefined();
    expect(() => getNextTouchDate(baseDate, 'bad' as CadenceType)).toThrow();
  });

  it('annotateContacts handles unknown cadence gracefully', () => {
    const contacts = [
      { id: '1', name: 'A', email: '', phone: '', company: '', title: '', relationshipStrength: 5, cadence: 'bad', notes: '', howWeMet: '', createdAt: baseDate, updatedAt: baseDate },
    ];
    const interactions = [
      { id: 'i1', contactId: '1', date: baseDate, channel: 'email', notes: '', createdAt: baseDate },
    ];
    // Should not throw, but nextTouch should be undefined
    let error: Error | null = null;
    let annotated: any[] = [];
    try {
      annotated = annotateContacts(contacts as any, interactions, now);
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeNull();
    expect(annotated[0].nextTouch).toBeUndefined();
  });
});

describe('edge case date logic', () => {
  it('handles leap year: monthly cadence from Feb 29', () => {
    const leap = new Date(2024, 1, 29); // Feb 29, 2024
    // March 29, 2024 (should be Mar 29)
    expect(getNextTouchDate(leap, 'monthly')).toEqual(new Date(2024, 2, 29));
    // Add 1 month to Feb 29, 2025 (not a leap year) should clamp to Mar 28
    const notLeap = new Date(2025, 1, 28); // Feb 28, 2025
    expect(getNextTouchDate(notLeap, 'monthly')).toEqual(new Date(2025, 2, 28));
  });

  it('handles end-of-month: monthly cadence from Jan 31', () => {
    const jan31 = new Date(2025, 0, 31); // Jan 31, 2025
    // Feb 28, 2025 (clamped)
    expect(getNextTouchDate(jan31, 'monthly')).toEqual(new Date(2025, 1, 28));
    // Mar 31, 2025
    const mar31 = new Date(2025, 2, 31);
    expect(getNextTouchDate(mar31, 'monthly')).toEqual(new Date(2025, 3, 30)); // April 30, 2025
  });

  it('handles quarterly cadence from Nov 30', () => {
    const nov30 = new Date(2025, 10, 30); // Nov 30, 2025
    // Feb 28, 2026 (clamped)
    expect(getNextTouchDate(nov30, 'quarterly')).toEqual(new Date(2026, 1, 28));
  });

  it('handles annual cadence from Feb 29 (leap year)', () => {
    const leap = new Date(2024, 1, 29); // Feb 29, 2024
    // Feb 28, 2025 (not a leap year)
    expect(getNextTouchDate(leap, 'annual')).toEqual(new Date(2025, 1, 28));
  });
});
