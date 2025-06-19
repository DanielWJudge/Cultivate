import React, { useState, useEffect } from 'react';
import type { Contact, Interaction } from './db';
import { useDatabase } from './useDatabase';
import styles from './ContactsGrid.module.css';
import modalStyles from './Modal.module.css';

interface LogInteractionModalProps {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  defaultContactId?: string;
}

const channelOptions = [
  'Email',
  'Phone',
  'Text',
  'In-Person',
  'Other',
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function LogInteractionModal({ open, onClose, contacts, defaultContactId }: LogInteractionModalProps) {
  const { addInteraction, updateContact } = useDatabase();
  const [contactId, setContactId] = useState(defaultContactId || (contacts[0]?.id ?? ''));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState(channelOptions[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fix: Update contactId when modal opens or defaultContactId changes
  useEffect(() => {
    if (open) {
      setContactId(defaultContactId || (contacts[0]?.id ?? ''));
    }
  }, [open, defaultContactId, contacts]);

  // Fix: Parse date as local midnight to avoid timezone shift
  function parseDateLocal(dateString: string) {
    return new Date(dateString + 'T00:00');
  }

  function validate() {
    if (!contactId) return 'Contact is required.';
    if (!date) return 'Date is required.';
    if (!channel) return 'Channel is required.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const interaction: Interaction = {
      id: generateId(),
      contactId,
      date: parseDateLocal(date), // Use local midnight
      channel,
      notes,
      createdAt: new Date(),
    };
    await addInteraction(interaction);
    await updateContact(contactId, { updatedAt: new Date() });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  }

  if (!open) return null;

  return (
    <div className={modalStyles.modalOverlay} role="dialog" aria-modal="true" aria-label="Log Interaction">
      <div className={modalStyles.modalContent}>
        <button className={modalStyles.closeBtn} aria-label="Close" onClick={onClose}>&times;</button>
        <form className={styles.card} onSubmit={handleSubmit} noValidate aria-label="Log Interaction">
          <h3>Log Interaction</h3>
          <label htmlFor="contact">Contact</label>
          <select id="contact" name="contact" value={contactId} onChange={e => setContactId(e.target.value)} required>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />

          <label htmlFor="channel">Channel</label>
          <select id="channel" name="channel" value={channel} onChange={e => setChannel(e.target.value)} required>
            {channelOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} />

          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          <button type="submit" style={{ marginTop: 12 }}>Log Interaction</button>
          {success && <div role="status" style={{ color: 'green', marginTop: 8 }}>Interaction logged!</div>}
        </form>
      </div>
    </div>
  );
}
