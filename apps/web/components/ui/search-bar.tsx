'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp } from 'lucide-react';
import { apiGet } from '../../lib/api-client';
import { useDebounce } from '../../hooks/use-debounce';

const POPULAR = ['Python for beginners', 'Machine learning', 'Data science', 'Deep learning', 'React'];

export function SearchBar() {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    apiGet<string[]>(`/api/v1/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = (q: string) => {
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/courses?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && submit(query)}
          placeholder="Search courses, topics..."
          className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-up">
          {suggestions.length > 0 ? (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Suggestions</p>
              {suggestions.map((s) => (
                <button key={s} onClick={() => { setQuery(s); submit(s); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                </button>
              ))}
            </div>
          ) : query.length < 2 ? (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Popular searches
              </p>
              {POPULAR.map((s) => (
                <button key={s} onClick={() => { setQuery(s); submit(s); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                </button>
              ))}
            </div>
          ) : loading ? (
            <div className="py-6 text-center">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="py-4 px-4 text-center">
              <p className="text-sm text-gray-500">No results for "{query}"</p>
              <button onClick={() => submit(query)}
                className="text-xs text-brand-600 hover:underline mt-1">
                Search anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
