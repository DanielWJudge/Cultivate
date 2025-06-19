import React, { useState } from 'react';
import Modal from './Modal';
import AddContactForm from './AddContactForm';

export default function AddContactModalButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ margin: '1.5rem 0', fontSize: '1rem', padding: '0.5rem 1.2rem', borderRadius: 6, border: '1px solid #2a7d46', background: '#2a7d46', color: '#fff', cursor: 'pointer' }}>
        Add Contact
      </button>
      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Add Contact">
        <AddContactForm />
      </Modal>
    </>
  );
}
