import React, { useState } from 'react';
import { useDatabase } from './useDatabase';
import type { Contact, Interaction } from './db';
import styles from './ContactsGrid.module.css';
import Modal from './Modal';
import EditContactForm from './EditContactForm';
import LogInteractionModal from './LogInteractionModal';
import ContactDetailModal from './ContactDetailModal';
import { annotateContacts, sortByUrgency } from './cadenceUtils';

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

function getStatus(contact: { overdue?: boolean; nextTouch?: Date; daysOverdue?: number }): 'overdue' | 'dueSoon' | 'ok' {
  if (contact.overdue) return 'overdue';
  if (contact.nextTouch && contact.daysOverdue === undefined && contact.nextTouch.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) return 'dueSoon';
  return 'ok';
}

function ContactsList() {
  const { getContacts, getInteractions, updateContact, deleteContact } = useDatabase();
  const [editError, setEditError] = useState<{ [id: string]: string | null }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; contact: ContactWithLastInteraction | null }>({ open: false, contact: null });
  const [logModal, setLogModal] = useState<{ open: boolean; contactId?: string }>({ open: false });
  const [detailModal, setDetailModal] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });
  const [sortBy, setSortBy] = useState<'name'|'due'|'urgency'>('urgency');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [allContacts, setAllContacts] = React.useState<ContactWithLastInteraction[]>([]);
  const [allInteractions, setAllInteractions] = React.useState<Interaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const contactsSub = getContacts().subscribe((contacts) => {
      setAllContacts(contacts);
      setLoading(false);
    });
    const interactionsSub = getInteractions().subscribe((ints) => {
      setAllInteractions(ints);
    });
    return () => {
      contactsSub.unsubscribe();
      interactionsSub.unsubscribe();
    };
  }, [getContacts, getInteractions]);

  // Annotate and filter/sort
  const now = new Date();
  let annotated = annotateContacts(allContacts, allInteractions, now);
  if (showOverdueOnly) annotated = annotated.filter(c => c.overdue);
  if (sortBy === 'urgency') annotated = sortByUrgency(annotated);
  else if (sortBy === 'due') annotated = [...annotated].sort((a, b) => {
    if (!a.nextTouch) return 1;
    if (!b.nextTouch) return -1;
    return a.nextTouch.getTime() - b.nextTouch.getTime();
  });
  else if (sortBy === 'name') annotated = [...annotated].sort((a, b) => a.name.localeCompare(b.name));

  // Use annotated for all lookups
  const handleEdit = (id: string) => {
    const contact = annotated.find((c) => c.id === id) || null;
    setEditModal({ open: true, contact });
  };
  const handleEditModalSave = async (fields: Partial<Contact>) => {
    if (!editModal.contact) return;
    const id = editModal.contact.id;
    const err = validateContact(fields);
    setEditError((e) => ({ ...e, [id]: err }));
    if (err) return;
    const prev = annotated.find((c) => c.id === id)!;
    setEditModal({ open: false, contact: null });
    setEditError((e) => { const rest = { ...e }; delete rest[id]; return rest; });
    try {
      await updateContact(id, fields);
    } catch {
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
    setDeleteId(null);
    try {
      await deleteContact(deleteId);
    } catch {
      setDeleteError('Failed to delete. Rolled back.');
    }
  };
  const cancelDelete = () => setDeleteId(null);

  if (loading) return <div className={styles.loading}>Loading contacts…</div>;
  if (!annotated.length) return <div className={styles.empty}>No contacts found.</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <label>
          <input type="checkbox" checked={showOverdueOnly} onChange={e => setShowOverdueOnly(e.target.checked)} /> Overdue only
        </label>
        <label>
          Sort by:{' '}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name'|'due'|'urgency')}>
            <option value="urgency">Urgency</option>
            <option value="due">Due date</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className={styles.grid}>
        {annotated.map((c) => {
          const status = getStatus(c);
          let statusColor = styles.statusOk;
          if (status === 'overdue') statusColor = styles.statusOverdue;
          else if (status === 'dueSoon') statusColor = styles.statusDueSoon;
          return (
            <div
              className={styles.card}
              key={c.id}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${c.name}`}
              onClick={() => setDetailModal({ open: true, contact: c })}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDetailModal({ open: true, contact: c }); }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={statusColor} title={status} aria-label={status} />
                <div
                  className={styles.name}
                  style={{ textDecoration: 'underline', color: '#2a7d46', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setDetailModal({ open: true, contact: c }); }}
                  tabIndex={0}
                  role="link"
                  aria-label={`View details for ${c.name}`}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') setDetailModal({ open: true, contact: c }); }}
                >
                  {c.name}
                </div>
              </div>
              <div className={styles.company}>{c.company}</div>
              <div className={styles.strength}>Relationship: {c.relationshipStrength}/10</div>
              <div className={styles.lastInteraction}>
                Last interaction: {formatDate(c.lastInteraction)}
              </div>
              <div className={styles.nextTouch}>
                {(() => {
                  const cadence = c.cadence === 'yearly' ? 'annual' : c.cadence;
                  return cadence !== 'monthly' && cadence !== 'quarterly' && cadence !== 'semi-annual' && cadence !== 'annual';
                })() ? (
                  <span style={{ color: '#b00020', fontWeight: 500 }}>Unsupported cadence</span>
                ) : c.overdue
                  ? <span style={{ color: '#b00020', fontWeight: 500 }}>{c.daysOverdue} day{c.daysOverdue === 1 ? '' : 's'} overdue</span>
                  : c.nextTouch
                    ? <span style={{ color: '#bfa900', fontWeight: 500 }}>Due in {Math.ceil((c.nextTouch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} day{Math.ceil((c.nextTouch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) === 1 ? '' : 's'}</span>
                    : <span style={{ color: '#2a7d46' }}>No due date</span>
                }
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={e => { e.stopPropagation(); handleEdit(c.id); }} style={{ color: '#fff', background: '#2a7d46', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Edit</button>
                <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{ color: '#fff', background: '#b00020', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Delete</button>
                <button onClick={e => { e.stopPropagation(); setLogModal({ open: true, contactId: c.id }); }} style={{ color: '#fff', background: '#0077cc', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Log Interaction</button>
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
        contacts={annotated}
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
