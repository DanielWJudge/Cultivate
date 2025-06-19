import React, { useState } from 'react';
import { useDatabase } from './useDatabase';
import type { Contact } from './db';
import styles from './ContactsGrid.module.css';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getNow() {
  return new Date();
}

const initialState: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  phone: '',
  company: '',
  title: '',
  relationshipStrength: 5,
  cadence: 'monthly',
  notes: '',
  howWeMet: '',
};

export default function AddContactForm() {
  const { addContact } = useDatabase();
  const [fields, setFields] = useState(initialState);
  const [touched, setTouched] = useState<{ [K in keyof typeof initialState]?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!fields.name.trim()) return 'Name is required.';
    if (fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) return 'Invalid email address.';
    if (fields.relationshipStrength < 1 || fields.relationshipStrength > 10) return 'Relationship strength must be 1-10.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({});
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const now = getNow();
    const contact: Contact = {
      ...fields,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await addContact(contact);
    setSuccess(true);
    setFields(initialState);
    setTimeout(() => setSuccess(false), 2000);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setFields((f) => ({
      ...f,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  const errMsg = (touched.name || touched.email || touched.relationshipStrength) && error ? error : '';

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate aria-label="Add Contact">
      <h3>Add Contact</h3>
      <label htmlFor="name">Name *</label>
      <input
        id="name"
        name="name"
        type="text"
        value={fields.name}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        aria-invalid={!!errMsg && !fields.name}
        aria-describedby="name-error"
      />
      <div id="name-error" style={{ color: 'red', fontSize: '0.9em' }}>
        {touched.name && !fields.name && 'Name is required.'}
      </div>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={fields.email}
        onChange={handleChange}
        onBlur={handleBlur}
        pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
        aria-invalid={!!errMsg && !!fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)}
        aria-describedby="email-error"
      />
      <div id="email-error" style={{ color: 'red', fontSize: '0.9em' }}>
        {touched.email && fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email) && 'Invalid email address.'}
      </div>

      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" type="tel" value={fields.phone} onChange={handleChange} onBlur={handleBlur} />

      <label htmlFor="company">Company</label>
      <input id="company" name="company" type="text" value={fields.company} onChange={handleChange} onBlur={handleBlur} />

      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" value={fields.title} onChange={handleChange} onBlur={handleBlur} />

      <label htmlFor="relationshipStrength">Relationship Strength (1-10)</label>
      <input
        id="relationshipStrength"
        name="relationshipStrength"
        type="number"
        min={1}
        max={10}
        value={fields.relationshipStrength}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        aria-invalid={!!errMsg && (fields.relationshipStrength < 1 || fields.relationshipStrength > 10)}
        aria-describedby="strength-error"
      />
      <div id="strength-error" style={{ color: 'red', fontSize: '0.9em' }}>
        {touched.relationshipStrength && (fields.relationshipStrength < 1 || fields.relationshipStrength > 10) && 'Relationship strength must be 1-10.'}
      </div>

      <label htmlFor="cadence">Cadence</label>
      <select id="cadence" name="cadence" value={fields.cadence === 'yearly' ? 'annual' : fields.cadence} onChange={handleChange} onBlur={handleBlur}>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="annual">Yearly</option>
      </select>

      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" value={fields.notes} onChange={handleChange} onBlur={handleBlur} />

      <label htmlFor="howWeMet">How We Met</label>
      <input id="howWeMet" name="howWeMet" type="text" value={fields.howWeMet} onChange={handleChange} onBlur={handleBlur} />

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button type="submit" style={{ marginTop: 12 }}>Add Contact</button>
      {success && <div role="status" style={{ color: 'green', marginTop: 8 }}>Contact added!</div>}
    </form>
  );
}
