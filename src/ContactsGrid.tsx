import React, { useState } from 'react';
import { useDatabase } from './useDatabase';
import type { Contact, Interaction } from './db';
import styles from './ContactsGrid.module.css';
import Modal from './Modal';
import EditContactForm from './EditContactForm';

function formatDate(date?: Date | string) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleDateString() ?? '—';
}

interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date | string;
}

interface EditState {
  [id: string]: Partial<Contact>;
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
  const [edit, setEdit] = useState<EditState>({});
  const [editError, setEditError] = useState<{ [id: string]: string | null }>({});
  const [optimistic, setOptimistic] = useState<{ [id: string]: ContactWithLastInteraction }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; contact: ContactWithLastInteraction | null }>({ open: false, contact: null });

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
    setEditError((e) => { const { [id]: _, ...rest } = e; return rest; });
    try {
      await updateContact(id, fields);
      setOptimistic((o) => { const { [id]: _, ...rest } = o; return rest; });
    } catch (e) {
      setOptimistic((o) => { const { [id]: _, ...rest } = o; return rest; });
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
    setOptimistic((o) => { const { [deleteId]: _, ...rest } = o; return rest; });
    setDeleteId(null);
    try {
      setContacts((c) => c.filter((x) => x.id !== deleteId));
      await deleteContact(deleteId);
    } catch (e) {
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
          const isEditing = false; // Modal editing only
          const optimisticC = optimistic[c.id] || c;
          return (
            <div className={styles.card} key={c.id}>
              <div className={styles.name}>{optimisticC.name}</div>
              <div className={styles.company}>{optimisticC.company}</div>
              <div className={styles.strength}>Relationship: {optimisticC.relationshipStrength}/10</div>
              <div className={styles.lastInteraction}>
                Last interaction: {formatDate(optimisticC.lastInteraction)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => handleEdit(c.id)} style={{ color: '#fff', background: '#2a7d46', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Edit</button>
                <button onClick={() => handleDelete(c.id)} style={{ color: '#fff', background: '#b00020', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Delete</button>
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
