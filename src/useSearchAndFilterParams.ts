import { useEffect } from 'react';

export function useSearchAndFilterParams(value: { search: string; relationship: string; cadence: string }, onChange: (v: { search: string; relationship: string; cadence: string }) => void) {
  // Update URL params when value changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (value.search) params.set('search', value.search);
    if (value.relationship) params.set('relationship', value.relationship);
    if (value.cadence) params.set('cadence', value.cadence);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [value]);

  // On mount, read params and update filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || '';
    const relationship = params.get('relationship') || '';
    const cadence = params.get('cadence') || '';
    if (search || relationship || cadence) {
      onChange({ search, relationship, cadence });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
