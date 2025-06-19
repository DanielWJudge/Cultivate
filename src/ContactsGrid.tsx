import React, { useState } from 'react';
import { useDatabase } from './useDatabase';
import type { Contact, Interaction } from './db';
import styles from './ContactsGrid.module.css';
import Modal from './Modal';
import EditContactForm from './EditContactForm';
import LogInteractionModal from './LogInteractionModal';
import ContactDetailModal from './ContactDetailModal';

function formatDate(date?: Date | string) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleDateString() ?? '—';
}

interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date | string;
}

function validateContact(fields: Partial<Contact>): string | null {
  if (!fields.name || !fields.name.trim()) return 'Name is required.';
  if (fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) return 'Invalid email address.';
  if (fields.relationshipStrength !== undefined && (fields.relationshipStrength < 1 || fields.relationshipStrength > 10)) return 'Relationship strength must be 1-10.';
  return null;
}

function ContactsList() {
  const { getContacts, getInteractions, updateContact, deleteContact } = useDatabase();
  const [contacts, setContacts] = React.useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editError, setEditError] = useState<{ [id: string]: string | null }>({});
  const [optimistic, setOptimistic] = useState<{ [id: string]: ContactWithLastInteraction }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; contact: ContactWithLastInteraction | null }>({ open: false, contact: null });
  const [logModal, setLogModal] = useState<{ open: boolean; contactId?: string }>({ open: false });
  const [detailModal, setDetailModal] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });

  React.useEffect(() => {
    // Subscribe to both contacts and interactions for live updates
    const contactsSub = getContacts().subscribe(async (contacts) => {
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
    // Also subscribe to all interactions to force refresh on any change
    const interactionsSub = getInteractions().subscribe(() => {
      // This will trigger the contactsSub again due to state update
      setLoading(true);
      getContacts().subscribe(async (contacts) => {
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
    });
    return () => {
      contactsSub.unsubscribe();
      interactionsSub.unsubscribe();
    };
  }, [getContacts, getInteractions]);

  const handleEdit = (id: string) => {
    const contact = contacts.find((c) => c.id === id) || null;
    setEditModal({ open: true, contact });
  };
  const handleEditModalSave = async (fields: Partial<Contact>) => {
    if (!editModal.contact) return;
    const id = editModal.contact.id;
    const err = validateContact(fields);
    setEditError((e) => ({ ...e, [id]: err }));
    if (err) return;
    const prev = contacts.find((c) => c.id === id)!;
    const optimisticContact = { ...prev, ...fields };
    setOptimistic((o) => ({ ...o, [id]: optimisticContact }));
    setEditModal({ open: false, contact: null });
    setEditError((e) => { const rest = { ...e }; delete rest[id]; return rest; });
    try {
      await updateContact(id, fields);
      setOptimistic((o) => { const rest = { ...o }; delete rest[id]; return rest; });
    } catch {
      setOptimistic((o) => { const rest = { ...o }; delete rest[id]; return rest; });
      setEditModal({ open: true, contact: prev });
      setEditError((e) => ({ ...e, [id]: 'Failed to update. Rolled back.' }));
    }
  };
  const handleEditModalCancel = () => setEditModal({ open: false, contact: null });
  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    const prev = contacts.find((c) => c.id === deleteId)!;
    setOptimistic((o) => { const rest = { ...o }; if (deleteId) delete rest[deleteId]; return rest; });
    setDeleteId(null);
    try {
      setContacts((c) => c.filter((x) => x.id !== deleteId));
      await deleteContact(deleteId);
    } catch {
      setContacts((c) => [...c, prev]);
      setDeleteError('Failed to delete. Rolled back.');
    }
  };
  const cancelDelete = () => setDeleteId(null);

  if (loading) return <div className={styles.loading}>Loading contacts…</div>;
  if (!contacts.length) return <div className={styles.empty}>No contacts found.</div>;

  return (
    <>
      <div className={styles.grid}>
        {contacts.map((c) => {
          const optimisticC = optimistic[c.id] || c;
          return (
            <div
              className={styles.card}
              key={c.id}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${optimisticC.name}`}
              onClick={() => setDetailModal({ open: true, contact: c })}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDetailModal({ open: true, contact: c }); }}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={styles.name}
                style={{ textDecoration: 'underline', color: '#2a7d46', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setDetailModal({ open: true, contact: c }); }}
                tabIndex={0}
                role="link"
                aria-label={`View details for ${optimisticC.name}`}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') setDetailModal({ open: true, contact: c }); }}
              >
                {optimisticC.name}
              </div>
              <div className={styles.company}>{optimisticC.company}</div>
              <div className={styles.strength}>Relationship: {optimisticC.relationshipStrength}/10</div>
              <div className={styles.lastInteraction}>
                Last interaction: {formatDate(optimisticC.lastInteraction)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={e => { e.stopPropagation(); handleEdit(c.id); }} style={{ color: '#fff', background: '#2a7d46', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Edit</button>
                <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{ color: '#fff', background: '#b00020', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Delete</button>
                <button onClick={e => { e.stopPropagation(); setLogModal({ open: true, contactId: c.id }); }} style={{ color: '#fff', background: '#0077cc', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Log Interaction</button>
                {/* Removed View button */}
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={editModal.open} onClose={handleEditModalCancel} ariaLabel="Edit Contact">
        {editModal.contact && (
          <EditContactForm
            contact={editModal.contact}
            onSave={handleEditModalSave}
            onCancel={handleEditModalCancel}
            error={editError[editModal.contact.id]}
          />
        )}
      </Modal>
      <Modal open={!!deleteId} onClose={cancelDelete} ariaLabel="Delete Contact Confirmation">
        <div style={{ padding: 8, minWidth: 220 }}>
          <h3>Delete Contact?</h3>
          <p>Are you sure you want to delete this contact?</p>
          {deleteError && <div style={{ color: 'red' }}>{deleteError}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={confirmDelete} style={{ color: '#fff', background: '#b00020', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Delete</button>
            <button onClick={cancelDelete} style={{ color: '#333', background: '#eee', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Cancel</button>
          </div>
        </div>
      </Modal>
      <LogInteractionModal
        open={logModal.open}
        onClose={() => setLogModal({ open: false })}
        contacts={contacts}
        defaultContactId={logModal.contactId}
      />
      <ContactDetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, contact: null })}
        contact={detailModal.contact}
      />
    </>
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
