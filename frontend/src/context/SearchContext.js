import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  // filters object - start with name filter enabled
  const [filters, setFilters] = useState({ name: true });

  const toggleNameFilter = () => setFilters((f) => ({ ...f, name: !f.name }));

  return (
    <SearchContext.Provider value={{ query, setQuery, filters, setFilters, toggleNameFilter }}>
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
