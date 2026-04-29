import React, { createContext, useContext, useState, useCallback } from 'react';

const DiscoveryContext = createContext();

export const DiscoveryProvider = ({ children }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('papers');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minYear, setMinYear] = useState('');
  const [selectedProviders, setSelectedProviders] = useState(['semantic-scholar', 'openalex', 'arxiv']);
  const [hasSearched, setHasSearched] = useState(false);

  const resetFilters = useCallback(() => {
    setMinYear('');
    if (mode === 'papers') {
      setSelectedProviders(['semantic-scholar', 'openalex', 'arxiv']);
    } else {
      setSelectedProviders(['zenodo', 'papers-with-code']);
    }
  }, [mode]);

  return (
    <DiscoveryContext.Provider value={{
      query, setQuery,
      mode, setMode,
      results, setResults,
      loading, setLoading,
      error, setError,
      minYear, setMinYear,
      selectedProviders, setSelectedProviders,
      hasSearched, setHasSearched,
      resetFilters
    }}>
      {children}
    </DiscoveryContext.Provider>
  );
};

export const useDiscovery = () => {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
};
