import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDatabase } from './useDatabase';

describe('useDatabase', () => {
  it('initializes the database without errors', () => {
    const { result } = renderHook(() => useDatabase());
    expect(result.current.db).toBeDefined();
    expect(result.current.db.name).toBe('CRMDatabase');
    expect(result.current.db.contacts).toBeDefined();
    expect(result.current.db.interactions).toBeDefined();
  });
});
