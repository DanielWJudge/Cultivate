import React, { useEffect, useState } from 'react';
import type { Contact, Interaction } from './db';
import { useDatabase } from './useDatabase';
import Modal from './Modal';
import styles from './ContactsGrid.module.css';

interface ContactDetailModalProps {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export default function ContactDetailModal({ open, onClose, contact }: ContactDetailModalProps) {
  const { getInteractions } = useDatabase();
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (open && contact) {
      const sub = getInteractions(contact.id).subscribe((data) => {
        setInteractions(
          [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      });
      return () => sub.unsubscribe();
    } else {
      setInteractions([]);
    }
  }, [open, contact, getInteractions]);

  if (!open || !contact) return null;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Contact Details">
      <div className={styles.card} style={{ minWidth: 320 }}>
        <h3>Contact Details</h3>
        <div><strong>Name:</strong> {contact.name}</div>
        <div><strong>Email:</strong> {contact.email}</div>
        <div><strong>Phone:</strong> {contact.phone}</div>
        <div><strong>Company:</strong> {contact.company}</div>
        <div><strong>Title:</strong> {contact.title}</div>
        <div><strong>Relationship Strength:</strong> {contact.relationshipStrength}/10</div>
        <div><strong>Cadence:</strong> {contact.cadence}</div>
        <div><strong>Notes:</strong> {contact.notes}</div>
        <div><strong>How We Met:</strong> {contact.howWeMet}</div>
        <hr style={{ margin: '1rem 0' }} />
        <h4>Interaction History</h4>
        {interactions.length === 0 ? (
          <div style={{ color: '#888' }}>No interactions yet.</div>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {interactions.map((i) => (
              <li key={i.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                <div><strong>Date:</strong> {new Date(i.date).toLocaleDateString()}</div>
                <div><strong>Channel:</strong> {i.channel}</div>
                <div><strong>Notes:</strong> {i.notes}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
