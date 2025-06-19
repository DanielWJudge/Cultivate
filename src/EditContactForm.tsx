import React from 'react';
import type { Contact } from './db';
import styles from './ContactsGrid.module.css';

interface EditContactFormProps {
  contact: Contact;
  onSave: (fields: Partial<Contact>) => void;
  onCancel: () => void;
  error?: string | null;
}

export default function EditContactForm({ contact, onSave, onCancel, error }: EditContactFormProps) {
  const [fields, setFields] = React.useState<Partial<Contact>>({ ...contact });

  function validate() {
    if (!fields.name || !fields.name.trim()) return 'Name is required.';
    if (fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) return 'Invalid email address.';
    if (fields.relationshipStrength !== undefined && (fields.relationshipStrength < 1 || fields.relationshipStrength > 10)) return 'Relationship strength must be 1-10.';
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setFields((f) => ({
      ...f,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  function handleBlur() {
    // No-op
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) return;
    onSave(fields);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate aria-label="Edit Contact">
      <h3>Edit Contact</h3>
      <label htmlFor="edit-name">Name *</label>
      <input
        id="edit-name"
        name="name"
        type="text"
        value={fields.name || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />
      <label htmlFor="edit-email">Email</label>
      <input
        id="edit-email"
        name="email"
        type="email"
        value={fields.email || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
      />
      <label htmlFor="edit-company">Company</label>
      <input id="edit-company" name="company" type="text" value={fields.company || ''} onChange={handleChange} onBlur={handleBlur} />
      <label htmlFor="edit-title">Title</label>
      <input id="edit-title" name="title" type="text" value={fields.title || ''} onChange={handleChange} onBlur={handleBlur} />
      <label htmlFor="edit-relationshipStrength">Relationship Strength (1-10)</label>
      <input
        id="edit-relationshipStrength"
        name="relationshipStrength"
        type="number"
        min={1}
        max={10}
        value={fields.relationshipStrength ?? 5}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />
      <label htmlFor="edit-cadence">Cadence</label>
      <select id="edit-cadence" name="cadence" value={fields.cadence === 'yearly' ? 'annual' : fields.cadence || 'monthly'} onChange={handleChange} onBlur={handleBlur}>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="annual">Yearly</option>
      </select>
      <label htmlFor="edit-notes">Notes</label>
      <textarea id="edit-notes" name="notes" value={fields.notes || ''} onChange={handleChange} onBlur={handleBlur} />
      <label htmlFor="edit-howWeMet">How We Met</label>
      <input id="edit-howWeMet" name="howWeMet" type="text" value={fields.howWeMet || ''} onChange={handleChange} onBlur={handleBlur} />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit" style={{ color: '#fff', background: '#2a7d46', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Save</button>
        <button type="button" onClick={onCancel} style={{ color: '#333', background: '#eee', border: 'none', borderRadius: 4, padding: '0.3rem 1rem' }}>Cancel</button>
      </div>
    </form>
  );
}
