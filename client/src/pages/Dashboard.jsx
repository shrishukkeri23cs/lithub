import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Loader2, BookOpen, Database, Filter } from 'lucide-react';
import axios from 'axios';
import { PaperCard, DatasetCard } from '../components/ResultCards';
import { getGroups } from '../utils/library';
import { useDiscovery } from '../context/DiscoveryContext';

const Dashboard = () => {
  const {
    query, setQuery,
    mode, setMode,
    results, setResults,
    loading, setLoading,
    error, setError,
    minYear, setMinYear,
    selectedProviders, setSelectedProviders,
    hasSearched, setHasSearched,
    resetFilters
  } = useDiscovery();
  
  const [groups] = useState(() => getGroups());

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!query || query.length < 3) return;

    setLoading(true);
    setError('');
    setResults([]);
    setHasSearched(true);

    try {
      const endpoint = mode === 'papers' ? '/api/search/papers' : '/api/search/datasets';
      const response = await axios.get(`http://localhost:5001${endpoint}`, {
        params: { 
          q: query, 
          limit: 15,
          minYear: minYear || undefined,
          providers: selectedProviders.join(',')
        }
      });
      if (Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults(response.data.results || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch results. Ensure backend is running.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [mode, query, minYear, selectedProviders]);

  // Dynamic Trigger: Re-search when filters change
  React.useEffect(() => {
    if (query && query.length >= 3) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 500); // 500ms debounce for year typing
      return () => clearTimeout(delayDebounceFn);
    }
  }, [minYear, selectedProviders, mode]);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 pb-24 space-y-8 fade-in">
      {/* Search Header */}
      <div className="space-y-4 max-w-6xl">
        <div className="flex items-center space-x-3 text-brand-amber text-sm font-mono tracking-tighter">
          <Filter className="w-5 h-5" />
          <span className="font-bold text-base uppercase">RESEARCH DISCOVERY ENGINE v1.0</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif">Explore the Academic Graph</h2>
        
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 reveal-2">
          <form 
            onSubmit={handleSearch} 
            className="relative flex-grow group focus-within:ring-4 focus-within:ring-brand-amber/20 rounded-2xl transition-all duration-500 shadow-2xl"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-brand-amber transition-colors" />
            <input 
              type="text" 
              placeholder={`Search for ${mode === 'papers' ? 'papers, authors, or topics' : 'datasets, benchmarks, or raw data'}...`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHasSearched(false);
              }}
              className="w-full bg-white/5 dark:bg-brand-navy border border-black/10 dark:border-white/10 rounded-2xl pl-14 pr-32 py-5 text-lg focus:outline-none transition-all"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-amber hover:bg-brand-amber-deep text-brand-navy px-6 py-2.5 rounded-xl font-bold transition-all premium-button"
            >
              Search
            </button>
          </form>

          <div className="glass-card flex items-center p-1.5 rounded-2xl border-brand-amber/20 shrink-0 shadow-2xl">
            <ModeToggle 
              active={mode === 'papers'} 
              onClick={() => { 
                setMode('papers'); 
                setSelectedProviders(['semantic-scholar', 'openalex', 'arxiv']);
                setHasSearched(false); 
              }} 
              icon={<BookOpen className="w-4 h-4" />} 
              label="Papers" 
            />
            <ModeToggle 
              active={mode === 'datasets'} 
              onClick={() => { 
                setMode('datasets'); 
                setSelectedProviders(['zenodo', 'papers-with-code']);
                setHasSearched(false); 
              }} 
              icon={<Database className="w-4 h-4" />} 
              label="Datasets" 
            />
          </div>
        </div>

        {/* Filter Panel - Always persistent single row */}
        <div className="glass-card w-full p-4 md:px-6 md:py-3 rounded-2xl border-brand-amber/20 flex flex-wrap lg:flex-nowrap items-center gap-8 reveal-3">
          <div className="flex items-center space-x-3 shrink-0">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Since Year:</label>
              <input 
                type="number" 
                min="1900" 
                max={new Date().getFullYear()} 
                placeholder="Year" 
                value={minYear} 
                onChange={(e) => setMinYear(e.target.value)} 
                className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-amber outline-none" 
              />
            </div>
            
            <div className="flex items-center space-x-3 shrink-0">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Sort:</label>
              <button className="text-[11px] font-bold px-3 py-1.5 bg-brand-amber text-brand-navy rounded-lg whitespace-nowrap">Citations (High)</button>
            </div>

            <div className="flex items-center space-x-3 xl:border-l xl:border-white/10 xl:pl-6 w-full xl:w-auto">
              <div className="flex flex-wrap gap-2 w-full">
                {[
                  { id: 'openalex', label: 'OpenAlex', type: 'paper' },
                  { id: 'semantic-scholar', label: 'Scholar', type: 'paper' },
                  { id: 'arxiv', label: 'ArXiv', type: 'paper' },
                  { id: 'zenodo', label: 'Zenodo', type: 'dataset' },
                  { id: 'papers-with-code', label: 'PWC', type: 'dataset' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const isAdding = !selectedProviders.includes(p.id);
                      if (isAdding) {
                        if (p.type === 'dataset' && mode === 'papers') {
                          setMode('datasets');
                          setSelectedProviders(['zenodo', 'papers-with-code']);
                        } else if (p.type === 'paper' && mode === 'datasets') {
                          setMode('papers');
                          setSelectedProviders(['semantic-scholar', 'openalex', 'arxiv']);
                        } else {
                          setSelectedProviders(prev => [...prev, p.id]);
                        }
                      } else {
                        setSelectedProviders(prev => prev.length > 1 ? prev.filter(x => x !== p.id) : prev);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedProviders.includes(p.id) 
                        ? 'bg-white/10 border-brand-amber text-brand-amber' 
                        : 'bg-white/2 border-white/5 text-gray-500 hover:text-gray-300'
                    } ${
                      (p.type === 'dataset' && mode === 'papers') || (p.type === 'paper' && mode === 'datasets')
                        ? 'opacity-60 grayscale-[0.5]'
                        : ''
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={resetFilters} 
              className="text-xs text-gray-500 hover:text-brand-amber underline transition-colors shrink-0 xl:ml-2 whitespace-nowrap"
            >
              Reset All
            </button>
          </div>
      </div>

      {/* Results Header */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col space-y-4 reveal-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-base">
              Showing <span className="text-white font-bold">{results.length}</span> results 
              {selectedProviders.length < 4 && (
                <> from <span className="italic">{selectedProviders.map(p => p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ')}</span></>
              )}
            </div>
            <div className="text-xs uppercase tracking-widest text-brand-amber font-bold animate-pulse">
              Sorting: Top Cited First
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24 space-y-4">
            <Loader2 className="w-12 h-12 text-brand-amber animate-spin" />
            <p className="text-gray-500 font-mono text-sm">Aggregating from multiple sources...</p>
          </div>
        ) : error && results.length === 0 ? (
          <div className="pt-24 text-center space-y-4">
            <p className="text-red-400">{error}</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((item, idx) => (
              <div key={item.id || idx} className={`reveal-${(idx % 4) + 1}`}>
                {mode === 'papers' ? (
                  <PaperCard paper={item} groups={groups} />
                ) : (
                  <DatasetCard dataset={item} groups={groups} />
                )}
              </div>
            ))}
          </div>
        ) : hasSearched && query ? (
          <div className="pt-24 text-center">
            <p className="text-gray-500 text-lg">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="pt-24 text-center space-y-6">
            <div className="bg-brand-amber/5 border border-brand-amber/10 rounded-3xl p-12 max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif mb-4">Start your literature review</h3>
              <p className="text-gray-400 leading-relaxed">
                Try searching for specific topics like "Transformer Architectures", "Climate Change Mitigation", 
                or discover datasets for "Medical Image Segmentation".
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModeToggle = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
      active 
        ? 'bg-brand-amber text-brand-navy shadow-lg shadow-brand-amber/20' 
        : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Dashboard;
