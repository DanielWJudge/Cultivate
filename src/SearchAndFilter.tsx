import React from 'react';

export interface SearchAndFilterProps {
  value: {
    search: string;
    relationship: string;
    cadence: string;
  };
  onChange: (value: { search: string; relationship: string; cadence: string }) => void;
  resultCount: number;
}

const relationshipOptions = [
  { value: '', label: 'All' },
  { value: 'A', label: 'A (Strong)' },
  { value: 'B', label: 'B (Medium)' },
  { value: 'C', label: 'C (Weak)' },
];

const cadenceOptions = [
  { value: '', label: 'All' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

export default function SearchAndFilter({ value, onChange, resultCount }: SearchAndFilterProps) {
  return (
    <form style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }} onSubmit={e => e.preventDefault()}>
      <input
        type="search"
        placeholder="Search name, company, email, notes..."
        value={value.search}
        onChange={e => onChange({ ...value, search: e.target.value })}
        style={{ flex: 2, minWidth: 180, padding: '0.5em', fontSize: '1rem' }}
        aria-label="Search"
      />
      <select
        value={value.relationship}
        onChange={e => onChange({ ...value, relationship: e.target.value })}
        style={{ flex: 1, minWidth: 120, padding: '0.5em', fontSize: '1rem' }}
        aria-label="Relationship Strength"
      >
        {relationshipOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select
        value={value.cadence}
        onChange={e => onChange({ ...value, cadence: e.target.value })}
        style={{ flex: 1, minWidth: 120, padding: '0.5em', fontSize: '1rem' }}
        aria-label="Cadence Type"
      >
        {cadenceOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span style={{ marginLeft: 12, fontWeight: 500, color: '#2a7d46' }}>{resultCount} result{resultCount === 1 ? '' : 's'}</span>
    </form>
  );
}
