import Dexie from 'dexie';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  relationshipStrength: number; // 1-10
  cadence: string; // e.g. 'monthly', 'quarterly'
  notes: string;
  howWeMet: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  contactId: string;
  date: Date;
  channel: string; // e.g. 'email', 'call', 'meeting'
  notes: string;
  createdAt: Date;
}

export class CRMDatabase extends Dexie {
  contacts!: Dexie.Table<Contact, string>;
  interactions!: Dexie.Table<Interaction, string>;

  constructor() {
    super('CRMDatabase');
    this.version(1).stores({
      contacts: 'id, name, email, company, relationshipStrength, cadence, createdAt, updatedAt',
      interactions: 'id, contactId, date, channel, createdAt',
    });
  }
}

// Seed data generator
export function generateSeedContacts(): Contact[] {
  const now = new Date();
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '555-123-4567',
      company: 'Acme Corp',
      title: 'Product Manager',
      relationshipStrength: 8,
      cadence: 'monthly',
      notes: 'Met at SaaS conference.',
      howWeMet: 'SaaS conference 2024',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      phone: '555-987-6543',
      company: 'Beta LLC',
      title: 'CTO',
      relationshipStrength: 6,
      cadence: 'quarterly',
      notes: 'Old college friend.',
      howWeMet: 'College',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      name: 'Carol Lee',
      email: 'carol.lee@example.com',
      phone: '555-222-3333',
      company: 'Gamma Inc',
      title: 'Designer',
      relationshipStrength: 7,
      cadence: 'monthly',
      notes: 'Worked together at Gamma.',
      howWeMet: 'Gamma Inc',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@example.com',
      phone: '555-444-5555',
      company: 'Delta Partners',
      title: 'Consultant',
      relationshipStrength: 5,
      cadence: 'quarterly',
      notes: 'Met at networking event.',
      howWeMet: 'Networking event',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '5',
      name: 'Eva Green',
      email: 'eva.green@example.com',
      phone: '555-666-7777',
      company: 'Epsilon Ltd',
      title: 'HR Lead',
      relationshipStrength: 9,
      cadence: 'monthly',
      notes: 'Family friend.',
      howWeMet: 'Family',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '6',
      name: 'Frank Moore',
      email: 'frank.moore@example.com',
      phone: '555-888-9999',
      company: 'Zeta Solutions',
      title: 'Engineer',
      relationshipStrength: 4,
      cadence: 'yearly',
      notes: 'Met at hackathon.',
      howWeMet: 'Hackathon',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '7',
      name: 'Grace Lin',
      email: 'grace.lin@example.com',
      phone: '555-101-2020',
      company: 'Eta Group',
      title: 'Sales Lead',
      relationshipStrength: 7,
      cadence: 'monthly',
      notes: 'Introduced by Carol.',
      howWeMet: 'Carol Lee',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '8',
      name: 'Henry Ford',
      email: 'henry.ford@example.com',
      phone: '555-303-4040',
      company: 'Theta Tech',
      title: 'CEO',
      relationshipStrength: 3,
      cadence: 'yearly',
      notes: 'Met at investor meeting.',
      howWeMet: 'Investor meeting',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '9',
      name: 'Ivy Chen',
      email: 'ivy.chen@example.com',
      phone: '555-505-6060',
      company: 'Iota Labs',
      title: 'Researcher',
      relationshipStrength: 6,
      cadence: 'quarterly',
      notes: 'Met at research summit.',
      howWeMet: 'Research summit',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '10',
      name: 'Jack Black',
      email: 'jack.black@example.com',
      phone: '555-707-8080',
      company: 'Kappa Ventures',
      title: 'Investor',
      relationshipStrength: 8,
      cadence: 'monthly',
      notes: 'Angel investor.',
      howWeMet: 'Startup pitch',
      createdAt: now,
      updatedAt: now,
    },
  ];
  return contacts;
}
