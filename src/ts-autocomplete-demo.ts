import type { Contact, Interaction } from './db';

// Demo: TypeScript autocomplete for Contact
const exampleContact: Contact = {
  id: 'demo',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '555-000-0000',
  company: 'Demo Co',
  title: 'Tester',
  relationshipStrength: 5,
  cadence: 'monthly',
  notes: 'This is a demo contact.',
  howWeMet: 'Demo event',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Demo: TypeScript autocomplete for Interaction
const exampleInteraction: Interaction = {
  id: 'interaction1',
  contactId: 'demo',
  date: new Date(),
  channel: 'email',
  notes: 'Reached out for demo.',
  createdAt: new Date(),
};

// Place a breakpoint or hover over the variables above to see autocomplete and type info in your editor.
