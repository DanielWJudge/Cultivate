import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders dashboard widgets', () => {
    render(<App />);
    expect(screen.getByText(/overdue contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/touches this month/i)).toBeInTheDocument();
    expect(screen.getByText(/recent interactions/i)).toBeInTheDocument();
  });
});
