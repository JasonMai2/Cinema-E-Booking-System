import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  // initialize query from localStorage so search persists across reloads
  const initialQuery = typeof window !== 'undefined' ? (localStorage.getItem('search.query') || '') : '';
  const [query, setQuery] = useState(initialQuery);
  // filters object - start with name filter enabled
  const [filters, setFilters] = useState({ name: true });
  // counter to force-refresh searches even when query string doesn't change
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('search.query', query || '');
    } catch (err) {
      // ignore storage errors
    }
  }, [query]);

  const toggleNameFilter = () => setFilters((f) => ({ ...f, name: !f.name }));

  const refreshSearch = () => setRefreshCounter((c) => c + 1);

  return (
    <SearchContext.Provider value={{ query, setQuery, filters, setFilters, toggleNameFilter, refreshCounter, refreshSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}

export default SearchContext;
